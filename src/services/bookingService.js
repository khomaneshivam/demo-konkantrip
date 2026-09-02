const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { resolvePropertyFrontDeskContact, triggerBookingNotifications, enqueueNotification } = require("./notificationService");
const { ensureRoomInventory, syncCalendarForDateRange } = require("./inventorySyncService");

/**
 * Generates an array of ISO date strings for all nights in a stay
 */
const getStayDates = (checkInStr, checkOutStr) => {
    const dates = [];
    const current = new Date(checkInStr + "T00:00:00");
    const end = new Date(checkOutStr + "T00:00:00");

    while (current < end) {
        dates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

/**
 * Generates a human-friendly unique booking number (e.g., KT-20260831-ABCD)
 */
const generateBookingNumber = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `KT-${today}-${randomSuffix}`;
};

/**
 * Creates a booking atomically with inventory verification and reservation
 */
const createBooking = async ({
    customerId,
    propertyId,
    roomId,
    checkInDate,
    checkOutDate,
    totalGuests = 1,
    adults = 1,
    children = 0,
    guestName,
    guestMobile,
    guestEmail = null,
    specialRequests = null,
    idempotencyKey = null,
    quantity = 1
}) => {
    // 1. Idempotency Check
    if (idempotencyKey) {
        const [existing] = await db.query(
            "SELECT * FROM bookings WHERE idempotency_key = ? LIMIT 1",
            [idempotencyKey]
        );
        if (existing.length > 0) {
            const booking = existing[0];
            const [rooms] = await db.query("SELECT * FROM booking_rooms WHERE booking_id = ?", [booking.booking_id]);
            return { booking, rooms, isDuplicate: true };
        }
    }

    // 2. Validate Dates
    const stayDates = getStayDates(checkInDate, checkOutDate);
    if (stayDates.length === 0) {
        const error = new Error("Check-out date must be after check-in date");
        error.statusCode = 400;
        throw error;
    }

    const totalNights = stayDates.length;
    const requestedQty = Math.max(1, Number(quantity) || 1);

    // 3. Verify Property & Room
    const [propRows] = await db.query(
        "SELECT * FROM properties WHERE property_id = ? AND delete_status = FALSE AND property_status IN ('Approved', 'Active') LIMIT 1",
        [propertyId]
    );
    if (propRows.length === 0) {
        const error = new Error("Selected property is not active or available for booking");
        error.statusCode = 404;
        throw error;
    }
    const property = propRows[0];

    const [roomRows] = await db.query(
        "SELECT * FROM rooms WHERE room_id = ? AND property_id = ? AND delete_status = FALSE AND is_active = TRUE LIMIT 1",
        [roomId, propertyId]
    );
    if (roomRows.length === 0) {
        const error = new Error("Selected room is not available for this property");
        error.statusCode = 404;
        throw error;
    }
    const room = roomRows[0];

    // Ensure inventory setup
    const inv = await ensureRoomInventory(roomId, propertyId);
    await syncCalendarForDateRange(propertyId, roomId, checkInDate, checkOutDate);

    // 4. Atomic MySQL Transaction
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
        let totalRoomPrice = 0;
        const nightlyBreakdowns = [];

        // Check availability for EVERY night of stay under lock
        for (const dateStr of stayDates) {
            let [calRows] = await conn.query(
                `SELECT * FROM inventory_calendar 
                 WHERE room_id = ? AND inventory_date = ? 
                 FOR UPDATE`,
                [roomId, dateStr]
            );

            if (calRows.length === 0) {
                // Initialize default calendar row if needed
                const totalUnits = Number(inv.total_units || 1);
                const dailyPrice = room.discount_price || room.base_price || 0;
                await conn.query(
                    `INSERT INTO inventory_calendar (
                        inventory_id, room_id, property_id, inventory_date,
                        total_units, available_units, booked_units, blocked_units,
                        daily_price, is_sellable, is_available, inventory_status
                    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, TRUE, TRUE, 'Available')
                    ON DUPLICATE KEY UPDATE total_units = VALUES(total_units)`,
                    [inv.inventory_id, roomId, propertyId, dateStr, totalUnits, totalUnits, dailyPrice]
                );

                const [refetched] = await conn.query(
                    `SELECT * FROM inventory_calendar WHERE room_id = ? AND inventory_date = ? FOR UPDATE`,
                    [roomId, dateStr]
                );
                calRows = refetched;
            }

            const cal = calRows[0];
            const availableUnits = Number(cal.available_units || 0);
            const isSellable = Boolean(cal.is_sellable);

            if (!isSellable || availableUnits < requestedQty) {
                const error = new Error(`Room is sold out or unavailable on ${dateStr}`);
                error.statusCode = 409;
                error.code = "SOLD_OUT";
                throw error;
            }

            const dailyPrice = cal.daily_discount_price || cal.daily_price || room.discount_price || room.base_price || 0;
            const nightTotal = Number(dailyPrice) * requestedQty;
            totalRoomPrice += nightTotal;

            nightlyBreakdowns.push({
                date: dateStr,
                price: Number(dailyPrice),
                total: nightTotal
            });

            // Decrement available units and increment booked units
            await conn.query(
                `UPDATE inventory_calendar 
                 SET available_units = available_units - ?,
                     booked_units = booked_units + ?,
                     inventory_status = CASE 
                         WHEN (available_units - ?) <= 0 THEN 'Sold Out'
                         WHEN (available_units - ?) <= 2 THEN 'Limited'
                         ELSE inventory_status 
                     END,
                     updated_by = ?
                 WHERE room_id = ? AND inventory_date = ?`,
                [requestedQty, requestedQty, requestedQty, requestedQty, customerId || null, roomId, dateStr]
            );

            // Audit Ledger Record in inventory_transactions
            await conn.query(
                `INSERT INTO inventory_transactions (
                    inventory_transaction_uuid, inventory_id, room_id, property_id,
                    transaction_date, transaction_type, transaction_direction,
                    quantity, previous_available_units, new_available_units,
                    source, reference_type, remarks, performed_by
                ) VALUES (?, ?, ?, ?, NOW(), 'Booking', 'Decrease', ?, ?, ?, 'Booking', 'Booking', 'OTA Customer Booking', ?)`,
                [
                    uuidv4(), inv.inventory_id, roomId, propertyId,
                    requestedQty, availableUnits, availableUnits - requestedQty,
                    customerId || null
                ]
            );
        }

        // 5. Create Booking Header
        const bookingNumber = generateBookingNumber();
        const finalAmount = totalRoomPrice; // Can add taxes/fees in future

        const [bookingInsert] = await conn.query(
            `INSERT INTO bookings (
                customer_id, property_id, booking_number,
                check_in_date, check_out_date, total_nights,
                total_guests, adults, children,
                guest_name, guest_mobile, guest_email,
                total_room_price, extra_charges, taxes, discount_amount, final_amount,
                currency, booking_status, payment_status, special_requests, idempotency_key
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00, ?, 'INR', 'CONFIRMED', 'Paid_At_Property', ?, ?)`,
            [
                customerId, propertyId, bookingNumber,
                checkInDate, checkOutDate, totalNights,
                Number(totalGuests) || 1, Number(adults) || 1, Number(children) || 0,
                guestName, guestMobile, guestEmail || null,
                totalRoomPrice, finalAmount,
                specialRequests || null, idempotencyKey || null
            ]
        );

        const bookingId = bookingInsert.insertId;

        // 6. Insert Booking Room Details
        const avgNightlyPrice = totalNights > 0 ? (totalRoomPrice / (totalNights * requestedQty)) : totalRoomPrice;
        await conn.query(
            `INSERT INTO booking_rooms (
                booking_id, room_id, room_name, room_type_id,
                quantity, nightly_price, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                bookingId, roomId, room.room_name, room.room_type_id || null,
                requestedQty, avgNightlyPrice, totalRoomPrice
            ]
        );

        // 7. Insert Status History
        await conn.query(
            `INSERT INTO booking_status_history (
                booking_id, old_status, new_status, reason, changed_by_type, changed_by_id
            ) VALUES (?, NULL, 'CONFIRMED', 'Initial booking creation', 'Customer', ?)`,
            [bookingId, customerId || null]
        );

        // Commit transaction
        await conn.commit();
        conn.release();

        // 8. Fetch complete booking object
        const [createdBooking] = await db.query("SELECT * FROM bookings WHERE booking_id = ?", [bookingId]);
        const [createdRooms] = await db.query("SELECT * FROM booking_rooms WHERE booking_id = ?", [bookingId]);

        const bookingResult = createdBooking[0];

        // 9. Asynchronously trigger WhatsApp and Email Notifications
        setImmediate(async () => {
            try {
                const frontDeskContact = await resolvePropertyFrontDeskContact(propertyId);
                await triggerBookingNotifications({
                    booking: bookingResult,
                    property,
                    rooms: createdRooms,
                    frontDeskContact
                });
            } catch (err) {
                console.error("Async notification error for booking:", err);
            }
        });

        return {
            booking: bookingResult,
            rooms: createdRooms,
            nightlyBreakdowns,
            property: {
                property_id: property.property_id,
                property_name: property.property_name,
                address: property.address,
                city: property.city,
                state: property.state
            }
        };
    } catch (err) {
        await conn.rollback();
        conn.release();
        throw err;
    }
};

/**
 * Cancels a booking and releases inventory
 */
const cancelBooking = async ({ bookingId, reason = "Customer Request", actorType = "Customer", actorId = null }) => {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
        const [bookings] = await conn.query(
            "SELECT * FROM bookings WHERE booking_id = ? OR booking_uuid = ? FOR UPDATE",
            [bookingId, bookingId]
        );

        if (bookings.length === 0) {
            const error = new Error("Booking not found");
            error.statusCode = 404;
            throw error;
        }

        const booking = bookings[0];
        if (booking.booking_status === "CANCELLED") {
            const error = new Error("Booking is already cancelled");
            error.statusCode = 400;
            throw error;
        }

        const [rooms] = await conn.query("SELECT * FROM booking_rooms WHERE booking_id = ?", [booking.booking_id]);
        const stayDates = getStayDates(booking.check_in_date, booking.check_out_date);

        // Update booking status
        await conn.query(
            "UPDATE bookings SET booking_status = 'CANCELLED' WHERE booking_id = ?",
            [booking.booking_id]
        );

        // Record status change in history
        await conn.query(
            `INSERT INTO booking_status_history (
                booking_id, old_status, new_status, reason, changed_by_type, changed_by_id
            ) VALUES (?, ?, 'CANCELLED', ?, ?, ?)`,
            [booking.booking_id, booking.booking_status, reason, actorType, actorId]
        );

        // Release inventory for each room & night
        for (const r of rooms) {
            const qty = Number(r.quantity) || 1;
            for (const dateStr of stayDates) {
                await conn.query(
                    `UPDATE inventory_calendar 
                     SET available_units = available_units + ?,
                         booked_units = GREATEST(0, booked_units - ?),
                         inventory_status = CASE 
                             WHEN (available_units + ?) > 2 THEN 'Available'
                             WHEN (available_units + ?) > 0 THEN 'Limited'
                             ELSE inventory_status 
                         END,
                         updated_by = ?
                     WHERE room_id = ? AND inventory_date = ?`,
                    [qty, qty, qty, qty, actorId, r.room_id, dateStr]
                );

                // Audit ledger
                const inv = await ensureRoomInventory(r.room_id, booking.property_id);
                await conn.query(
                    `INSERT INTO inventory_transactions (
                        inventory_transaction_uuid, inventory_id, room_id, property_id,
                        transaction_date, transaction_type, transaction_direction,
                        quantity, source, reference_type, remarks, performed_by
                    ) VALUES (?, ?, ?, ?, NOW(), 'Cancellation', 'Increase', ?, 'Booking', 'Cancellation', 'Booking Cancelled', ?)`,
                    [uuidv4(), inv.inventory_id, r.room_id, booking.property_id, qty, actorId]
                );
            }
        }

        await conn.commit();
        conn.release();

        // Async cancellation notification
        setImmediate(async () => {
            try {
                const [props] = await db.query("SELECT * FROM properties WHERE property_id = ?", [booking.property_id]);
                const property = props[0] || {};
                const frontDesk = await resolvePropertyFrontDeskContact(booking.property_id);

                if (booking.guest_mobile) {
                    await enqueueNotification({
                        bookingId: booking.booking_id,
                        recipientType: "Customer",
                        recipientPhone: booking.guest_mobile,
                        channel: "WhatsApp",
                        templateCode: "BOOKING_CANCELLATION_CUSTOMER",
                        payload: {
                            guest_name: booking.guest_name,
                            booking_number: booking.booking_number,
                            property_name: property.property_name || "Property",
                            check_in_date: booking.check_in_date,
                            check_out_date: booking.check_out_date
                        }
                    });
                }

                if (frontDesk?.contact_phone) {
                    await enqueueNotification({
                        bookingId: booking.booking_id,
                        recipientType: "Property Front Desk",
                        recipientPhone: frontDesk.contact_phone,
                        channel: "WhatsApp",
                        templateCode: "BOOKING_CANCELLATION_FRONTDESK",
                        payload: {
                            guest_name: booking.guest_name,
                            booking_number: booking.booking_number,
                            property_name: property.property_name || "Property",
                            check_in_date: booking.check_in_date,
                            check_out_date: booking.check_out_date,
                            room_name: rooms[0]?.room_name || "Room"
                        }
                    });
                }
            } catch (err) {
                console.error("Cancellation notification error:", err);
            }
        });

        const [updated] = await db.query("SELECT * FROM bookings WHERE booking_id = ?", [booking.booking_id]);
        return updated[0];
    } catch (err) {
        await conn.rollback();
        conn.release();
        throw err;
    }
};

module.exports = {
    createBooking,
    cancelBooking,
    getStayDates,
    generateBookingNumber
};
