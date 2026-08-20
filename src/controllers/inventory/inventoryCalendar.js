const db = require("../../config/db");
const { ensureRoomInventory, syncCalendarForDateRange, recordTransaction } = require("../../services/inventorySyncService");

const getInventoryCalendar = async (req, res) => {
    try {
        const { property_id, room_id, start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ success: false, message: "start_date and end_date are required (YYYY-MM-DD)" });
        }

        // Auto-sync date range for this property/room so any unsynced days or new rooms are populated
        if (property_id) {
            await syncCalendarForDateRange(property_id, room_id, start_date, end_date, req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null);
        }

        let query = `
            SELECT ic.*, r.room_name, r.room_code, r.base_price, r.discount_price as room_discount_price, p.property_name
            FROM inventory_calendar ic
            INNER JOIN rooms r ON r.room_id = ic.room_id
            INNER JOIN properties p ON p.property_id = ic.property_id
            WHERE ic.inventory_date BETWEEN ? AND ? AND r.delete_status = FALSE AND p.delete_status = FALSE
        `;
        const params = [start_date, end_date];

        if (property_id) {
            query += " AND ic.property_id = ?";
            params.push(property_id);
        }

        if (room_id) {
            query += " AND ic.room_id = ?";
            params.push(room_id);
        }

        query += " ORDER BY ic.inventory_date ASC, r.sort_order ASC";

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching inventory calendar:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch inventory calendar" });
    }
};

const updateInventoryCalendarDay = async (req, res) => {
    try {
        const {
            inventory_id,
            room_id,
            property_id,
            inventory_date,
            total_units,
            available_units,
            booked_units = 0,
            blocked_units = 0,
            maintenance_units = 0,
            stop_sell_units = 0,
            daily_price,
            daily_discount_price,
            is_sellable = true,
            is_available = true,
            closed_for_arrival = false,
            closed_for_departure = false,
            minimum_stay_nights = 1,
            maximum_stay_nights,
            inventory_status = "Available"
        } = req.body;

        if (!room_id || !property_id || !inventory_date || total_units === undefined) {
            return res.status(400).json({
                success: false,
                message: "room_id, property_id, inventory_date, and total_units are required"
            });
        }

        const userId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;

        // Ensure room_inventory row exists
        const invRecord = await ensureRoomInventory(room_id, property_id, userId);
        const resolvedInventoryId = invRecord.inventory_id;

        // Get previous available units for transaction audit
        const [prevRows] = await db.query(
            "SELECT available_units, booked_units, blocked_units FROM inventory_calendar WHERE inventory_id = ? AND inventory_date = ? LIMIT 1",
            [resolvedInventoryId, inventory_date]
        );
        const prevAvailable = prevRows[0]?.available_units ?? total_units;
        const prevBooked = prevRows[0]?.booked_units ?? 0;
        const prevBlocked = prevRows[0]?.blocked_units ?? 0;

        const calculatedAvailable = available_units !== undefined
            ? available_units
            : Math.max(0, total_units - (booked_units + blocked_units + maintenance_units + stop_sell_units));

        await db.query(
            `INSERT INTO inventory_calendar (
                inventory_id, room_id, property_id, inventory_date,
                total_units, available_units, booked_units, blocked_units,
                maintenance_units, stop_sell_units, daily_price, daily_discount_price,
                is_sellable, is_available, closed_for_arrival, closed_for_departure,
                minimum_stay_nights, maximum_stay_nights, inventory_status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_units = VALUES(total_units),
                available_units = VALUES(available_units),
                booked_units = VALUES(booked_units),
                blocked_units = VALUES(blocked_units),
                maintenance_units = VALUES(maintenance_units),
                stop_sell_units = VALUES(stop_sell_units),
                daily_price = VALUES(daily_price),
                daily_discount_price = VALUES(daily_discount_price),
                is_sellable = VALUES(is_sellable),
                is_available = VALUES(is_available),
                closed_for_arrival = VALUES(closed_for_arrival),
                closed_for_departure = VALUES(closed_for_departure),
                minimum_stay_nights = VALUES(minimum_stay_nights),
                maximum_stay_nights = VALUES(maximum_stay_nights),
                inventory_status = VALUES(inventory_status),
                updated_by = ?`,
            [
                resolvedInventoryId, room_id, property_id, inventory_date,
                total_units, calculatedAvailable, booked_units, blocked_units,
                maintenance_units, stop_sell_units,
                daily_price !== undefined && daily_price !== null && daily_price !== "" ? Number(daily_price) : null,
                daily_discount_price !== undefined && daily_discount_price !== null && daily_discount_price !== "" ? Number(daily_discount_price) : null,
                is_sellable, is_available,
                closed_for_arrival, closed_for_departure, minimum_stay_nights,
                maximum_stay_nights || null, inventory_status, userId,
                userId
            ]
        );

        // Record Audit Transaction
        await recordTransaction({
            propertyId: property_id,
            roomId: room_id,
            inventoryId: resolvedInventoryId,
            transactionDate: inventory_date,
            transactionType: "Manual Adjustment",
            transactionDirection: calculatedAvailable >= prevAvailable ? "Increase" : "Decrease",
            quantity: Math.abs(calculatedAvailable - prevAvailable),
            previousAvailable: prevAvailable,
            newAvailable: calculatedAvailable,
            previousBooked: prevBooked,
            newBooked: booked_units,
            previousBlocked: prevBlocked,
            newBlocked: blocked_units,
            reason: `Manual calendar update (${inventory_status})`,
            remarks: daily_price ? `Price set to ₹${daily_price}` : null,
            source: "Web",
            performedBy: userId
        });

        const [saved] = await db.query(
            "SELECT * FROM inventory_calendar WHERE inventory_id = ? AND inventory_date = ? LIMIT 1",
            [resolvedInventoryId, inventory_date]
        );

        return res.status(200).json({ success: true, message: "Calendar updated", data: saved[0] });
    } catch (error) {
        console.error("Error updating inventory calendar:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update calendar" });
    }
};

module.exports = {
    getInventoryCalendar,
    updateInventoryCalendarDay
};
