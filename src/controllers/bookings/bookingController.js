const bookingService = require("../../services/bookingService");
const { resolvePropertyFrontDeskContact } = require("../../services/notificationService");
const db = require("../../config/db");
const { isAdmin, isOwner } = require("../../middlewares/roleMiddleware");

/**
 * POST /api/v1/bookings
 * Creates a new booking with transactional atomic inventory reservation
 */
const createBooking = async (req, res) => {
    try {
        const body = req.body || {};
        const idempotencyKey = req.headers["idempotency-key"] || body.idempotency_key;

        const {
            property_id,
            room_id,
            check_in_date,
            check_out_date,
            total_guests = 1,
            adults = 1,
            children = 0,
            guest_name,
            guest_mobile,
            guest_email,
            special_requests,
            quantity = 1
        } = body;

        if (!property_id || !room_id || !check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: "Property ID, Room ID, Check-in Date, and Check-out Date are required"
            });
        }

        const resolvedGuestName = guest_name || req.user?.full_name || "Guest";
        const resolvedGuestMobile = guest_mobile || req.user?.mobile_number;
        const resolvedGuestEmail = guest_email || req.user?.email;

        if (!resolvedGuestMobile) {
            return res.status(400).json({
                success: false,
                message: "Guest mobile number is required"
            });
        }

        // Resolve customer_id if user is authenticated as customer
        let customerId = req.user?.customer_id;
        if (!customerId) {
            // Find or create customer by mobile/email
            const [existing] = await db.query(
                "SELECT customer_id FROM customers WHERE mobile_number = ? LIMIT 1",
                [resolvedGuestMobile]
            );
            if (existing.length > 0) {
                customerId = existing[0].customer_id;
            } else {
                const [insert] = await db.query(
                    "INSERT INTO customers (full_name, mobile_number, email) VALUES (?, ?, ?)",
                    [resolvedGuestName, resolvedGuestMobile, resolvedGuestEmail || null]
                );
                customerId = insert.insertId;
            }
        }

        const bookingResult = await bookingService.createBooking({
            customerId,
            propertyId: property_id,
            roomId: room_id,
            checkInDate: check_in_date,
            checkOutDate: check_out_date,
            totalGuests: total_guests,
            adults,
            children,
            guestName: resolvedGuestName,
            guestMobile: resolvedGuestMobile,
            guestEmail: resolvedGuestEmail,
            specialRequests: special_requests,
            idempotencyKey,
            quantity
        });

        return res.status(201).json({
            success: true,
            message: bookingResult.isDuplicate ? "Returning existing booking (Idempotent)" : "Booking created and confirmed successfully",
            data: bookingResult
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            code: error.code || "BOOKING_ERROR",
            message: error.message || "Failed to create booking"
        });
    }
};

/**
 * GET /api/v1/bookings
 * Lists bookings with role-based filtering (Owner, Staff, Admin, Customer)
 */
const getBookings = async (req, res) => {
    try {
        const {
            property_id,
            status,
            from_date,
            to_date,
            search,
            page = 1,
            limit = 20
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        const params = [];
        let whereClauses = ["1=1"];

        // Role-based Access Control
        if (req.user?.role === "customer" || req.user?.customer_id) {
            whereClauses.push("b.customer_id = ?");
            params.push(req.user.customer_id);
        } else if (req.user?.p_owner_id && !isAdmin(req.user)) {
            whereClauses.push("p.p_owner_id = ?");
            params.push(req.user.p_owner_id);
        } else if (req.user?.employee_id && !isAdmin(req.user)) {
            const assigned = Array.isArray(req.user.assigned_properties) ? req.user.assigned_properties : [];
            if (assigned.length === 0) {
                return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: 1, limit: Number(limit) } });
            }
            whereClauses.push(`p.property_id IN (${assigned.map(() => "?").join(",")})`);
            params.push(...assigned);
        }

        if (property_id) {
            whereClauses.push("b.property_id = ?");
            params.push(property_id);
        }

        if (status) {
            whereClauses.push("b.booking_status = ?");
            params.push(status);
        }

        if (from_date) {
            whereClauses.push("b.check_in_date >= ?");
            params.push(from_date);
        }

        if (to_date) {
            whereClauses.push("b.check_out_date <= ?");
            params.push(to_date);
        }

        if (search) {
            whereClauses.push("(b.booking_number LIKE ? OR b.guest_name LIKE ? OR b.guest_mobile LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereSql = whereClauses.join(" AND ");

        // Get total count
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total 
             FROM bookings b 
             INNER JOIN properties p ON p.property_id = b.property_id 
             WHERE ${whereSql}`,
            params
        );
        const total = countRows[0]?.total || 0;

        // Get bookings with property & room names
        const [rows] = await db.query(
            `SELECT b.*, p.property_name, pl.city, pl.state,
                    (SELECT br.room_name FROM booking_rooms br WHERE br.booking_id = b.booking_id LIMIT 1) as room_name,
                    (SELECT br.quantity FROM booking_rooms br WHERE br.booking_id = b.booking_id LIMIT 1) as room_quantity,
                    (SELECT pi.cdn_url FROM property_images pi WHERE pi.property_id = b.property_id AND pi.is_active = TRUE ORDER BY pi.is_cover_image DESC LIMIT 1) as property_image
             FROM bookings b
             INNER JOIN properties p ON p.property_id = b.property_id
             LEFT JOIN property_locations pl ON pl.property_id = p.property_id AND pl.delete_status = FALSE
             WHERE ${whereSql}
             ORDER BY b.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), Number(offset)]
        );

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch bookings" });
    }
};

/**
 * GET /api/v1/bookings/:idOrUuid
 * Retrieves full booking details including room details, history, and property contacts
 */
const getBookingById = async (req, res) => {
    try {
        const { idOrUuid } = req.params;

        const [bookings] = await db.query(
            `SELECT b.*, p.property_name,
                    CONCAT_WS(', ', pl.address_line1, pl.address_line2, pl.village, pl.taluka, pl.city, pl.district, pl.state) as property_address,
                    pl.city, pl.state, p.p_owner_id
             FROM bookings b
             INNER JOIN properties p ON p.property_id = b.property_id
             LEFT JOIN property_locations pl ON pl.property_id = p.property_id AND pl.delete_status = FALSE
             WHERE (b.booking_id = ? OR b.booking_uuid = ? OR b.booking_number = ?)
             LIMIT 1`,
            [idOrUuid, idOrUuid, idOrUuid]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const booking = bookings[0];

        // Access check
        if (req.user?.role === "customer" && req.user?.customer_id && Number(req.user.customer_id) !== Number(booking.customer_id)) {
            return res.status(403).json({ success: false, message: "Unauthorized to view this booking" });
        }
        if (req.user?.p_owner_id && !isAdmin(req.user) && Number(req.user.p_owner_id) !== Number(booking.p_owner_id)) {
            return res.status(403).json({ success: false, message: "Unauthorized to view this booking" });
        }

        // Fetch rooms
        const [rooms] = await db.query(
            "SELECT * FROM booking_rooms WHERE booking_id = ?",
            [booking.booking_id]
        );

        // Fetch status history
        const [history] = await db.query(
            "SELECT * FROM booking_status_history WHERE booking_id = ? ORDER BY created_at ASC",
            [booking.booking_id]
        );

        // Fetch property contact details
        const propertyContact = await resolvePropertyFrontDeskContact(booking.property_id);

        return res.status(200).json({
            success: true,
            data: {
                ...booking,
                rooms,
                history,
                property_contact: propertyContact
            }
        });
    } catch (error) {
        console.error("Error fetching booking detail:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch booking details" });
    }
};

/**
 * PUT /api/v1/bookings/:idOrUuid/status
 * Updates the booking status (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
 */
const updateBookingStatus = async (req, res) => {
    try {
        const { idOrUuid } = req.params;
        const { status, reason } = req.body || {};

        if (!status) {
            return res.status(400).json({ success: false, message: "New status is required" });
        }

        const normalizedStatus = String(status).toUpperCase();
        const validStatuses = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const [bookings] = await db.query(
            "SELECT * FROM bookings WHERE booking_id = ? OR booking_uuid = ? OR booking_number = ? LIMIT 1",
            [idOrUuid, idOrUuid, idOrUuid]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const booking = bookings[0];

        // If cancelling, execute full inventory release
        if (normalizedStatus === "CANCELLED") {
            const actorType = req.user?.role === "customer" ? "Customer" : (req.user?.p_owner_id ? "Property Owner" : (req.user?.employee_id ? "Employee" : "Admin"));
            const actorId = req.user?.customer_id || req.user?.p_owner_id || req.user?.employee_id || req.user?.admin_id;

            const cancelledBooking = await bookingService.cancelBooking({
                bookingId: booking.booking_id,
                reason: reason || "Status update to CANCELLED",
                actorType,
                actorId
            });

            return res.status(200).json({
                success: true,
                message: "Booking cancelled and room inventory released successfully",
                data: cancelledBooking
            });
        }

        // Standard status transition
        await db.query(
            "UPDATE bookings SET booking_status = ? WHERE booking_id = ?",
            [normalizedStatus, booking.booking_id]
        );

        const actorType = req.user?.p_owner_id ? "Property Owner" : (req.user?.employee_id ? "Employee" : (req.user?.admin_id ? "Admin" : "System"));
        const actorId = req.user?.p_owner_id || req.user?.employee_id || req.user?.admin_id || null;

        await db.query(
            `INSERT INTO booking_status_history (
                booking_id, old_status, new_status, reason, changed_by_type, changed_by_id
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [booking.booking_id, booking.booking_status, normalizedStatus, reason || null, actorType, actorId]
        );

        const [updated] = await db.query("SELECT * FROM bookings WHERE booking_id = ?", [booking.booking_id]);
        return res.status(200).json({
            success: true,
            message: `Booking status updated to ${normalizedStatus}`,
            data: updated[0]
        });
    } catch (error) {
        console.error("Error updating booking status:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update booking status"
        });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus
};
