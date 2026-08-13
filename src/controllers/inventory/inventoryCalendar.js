const db = require("../../config/db");

const getInventoryCalendar = async (req, res) => {
    try {
        const { property_id, room_id, start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ success: false, message: "start_date and end_date are required (YYYY-MM-DD)" });
        }

        let query = `
            SELECT ic.*, r.room_name, r.room_code, p.property_name
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
            is_sellable = true,
            is_available = true,
            closed_for_arrival = false,
            closed_for_departure = false,
            minimum_stay_nights = 1,
            maximum_stay_nights,
            inventory_status = "Available"
        } = req.body;

        if (!inventory_id || !room_id || !property_id || !inventory_date || total_units === undefined) {
            return res.status(400).json({
                success: false,
                message: "inventory_id, room_id, property_id, inventory_date, and total_units are required"
            });
        }

        const calculatedAvailable = available_units !== undefined
            ? available_units
            : Math.max(0, total_units - (booked_units + blocked_units + maintenance_units + stop_sell_units));

        const userId = req.user?.p_owner_id || req.user?.admin_id || null;

        await db.query(
            `INSERT INTO inventory_calendar (
                inventory_id, room_id, property_id, inventory_date,
                total_units, available_units, booked_units, blocked_units,
                maintenance_units, stop_sell_units, is_sellable, is_available,
                closed_for_arrival, closed_for_departure, minimum_stay_nights,
                maximum_stay_nights, inventory_status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_units = VALUES(total_units),
                available_units = VALUES(available_units),
                booked_units = VALUES(booked_units),
                blocked_units = VALUES(blocked_units),
                maintenance_units = VALUES(maintenance_units),
                stop_sell_units = VALUES(stop_sell_units),
                is_sellable = VALUES(is_sellable),
                is_available = VALUES(is_available),
                closed_for_arrival = VALUES(closed_for_arrival),
                closed_for_departure = VALUES(closed_for_departure),
                minimum_stay_nights = VALUES(minimum_stay_nights),
                maximum_stay_nights = VALUES(maximum_stay_nights),
                inventory_status = VALUES(inventory_status),
                updated_by = ?`,
            [
                inventory_id, room_id, property_id, inventory_date,
                total_units, calculatedAvailable, booked_units, blocked_units,
                maintenance_units, stop_sell_units, is_sellable, is_available,
                closed_for_arrival, closed_for_departure, minimum_stay_nights,
                maximum_stay_nights || null, inventory_status, userId,
                userId
            ]
        );

        const [saved] = await db.query(
            "SELECT * FROM inventory_calendar WHERE inventory_id = ? AND inventory_date = ? LIMIT 1",
            [inventory_id, inventory_date]
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
