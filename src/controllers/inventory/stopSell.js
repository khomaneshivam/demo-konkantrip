const db = require("../../config/db");

const getStopSellRules = async (req, res) => {
    try {
        const { property_id, room_id, status, include_cancelled } = req.query;
        let query = `
            SELECT ss.*, r.room_name, r.room_code, p.property_name
            FROM stop_sell ss
            LEFT JOIN rooms r ON r.room_id = ss.room_id
            INNER JOIN properties p ON p.property_id = ss.property_id
            WHERE p.delete_status = FALSE AND (r.delete_status IS NULL OR r.delete_status = FALSE)
        `;
        const params = [];

        if (property_id) {
            query += " AND ss.property_id = ?";
            params.push(property_id);
        }

        if (room_id) {
            query += " AND ss.room_id = ?";
            params.push(room_id);
        }

        if (status) {
            query += " AND ss.status = ?";
            params.push(status);
        } else if (include_cancelled !== "true") {
            query += " AND ss.status != 'Cancelled'";
        }

        query += " ORDER BY ss.start_date DESC, ss.created_at DESC";

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching stop sell rules:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch stop sell rules" });
    }
};

const createStopSellRule = async (req, res) => {
    try {
        const {
            property_id,
            room_id,
            inventory_id,
            stop_sell_reference,
            stop_sell_type = "Room",
            reason_type = "Operational",
            reason,
            start_date,
            end_date,
            start_time,
            end_time,
            affects_new_bookings = true,
            affects_modifications = false,
            affects_existing_bookings = false,
            affects_all_channels = true,
            status = "Scheduled",
            release_automatically = false,
            remarks
        } = req.body;

        if (!property_id || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: "property_id, start_date, and end_date are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO stop_sell (
                property_id, room_id, inventory_id, stop_sell_reference,
                stop_sell_type, reason_type, reason, start_date, end_date,
                start_time, end_time, affects_new_bookings, affects_modifications,
                affects_existing_bookings, affects_all_channels, status,
                release_automatically, remarks, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                property_id, room_id || null, inventory_id || null, stop_sell_reference || null,
                stop_sell_type, reason_type, reason || null, start_date, end_date,
                start_time || null, end_time || null, affects_new_bookings, affects_modifications,
                affects_existing_bookings, affects_all_channels, status,
                release_automatically, remarks || null, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM stop_sell WHERE stop_sell_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Stop sell rule created", data: created[0] });
    } catch (error) {
        console.error("Error creating stop sell rule:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create stop sell rule" });
    }
};

const releaseStopSellRule = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            `UPDATE stop_sell
             SET status = 'Released',
                 released_by = ?,
                 released_at = NOW(),
                 updated_by = ?
             WHERE stop_sell_id = ? AND status IN ('Scheduled', 'Active')`,
            [req.user?.p_owner_id || req.user?.admin_id || null, req.user?.p_owner_id || req.user?.admin_id || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Active stop sell rule not found" });
        }

        const [updated] = await db.query("SELECT * FROM stop_sell WHERE stop_sell_id = ?", [id]);
        return res.status(200).json({ success: true, message: "Stop sell rule released", data: updated[0] });
    } catch (error) {
        console.error("Error releasing stop sell rule:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to release stop sell rule" });
    }
};

const cancelStopSellRule = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            `UPDATE stop_sell
             SET status = 'Cancelled',
                 cancelled_by = ?,
                 cancelled_at = NOW(),
                 updated_by = ?
             WHERE stop_sell_id = ? AND status IN ('Scheduled', 'Active')`,
            [req.user?.p_owner_id || req.user?.admin_id || null, req.user?.p_owner_id || req.user?.admin_id || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Active stop sell rule not found" });
        }

        return res.status(200).json({ success: true, message: "Stop sell rule cancelled" });
    } catch (error) {
        console.error("Error cancelling stop sell rule:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to cancel stop sell rule" });
    }
};

module.exports = {
    getStopSellRules,
    createStopSellRule,
    releaseStopSellRule,
    cancelStopSellRule
};
