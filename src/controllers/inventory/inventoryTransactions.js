const db = require("../../config/db");

const getInventoryTransactions = async (req, res) => {
    try {
        const { property_id, room_id, inventory_id, transaction_type, start_date, end_date, limit = 50 } = req.query;
        let query = `
            SELECT it.*, r.room_name, p.property_name
            FROM inventory_transactions it
            INNER JOIN rooms r ON r.room_id = it.room_id
            INNER JOIN properties p ON p.property_id = it.property_id
            WHERE 1=1
        `;
        const params = [];

        if (property_id) {
            query += " AND it.property_id = ?";
            params.push(property_id);
        }

        if (room_id) {
            query += " AND it.room_id = ?";
            params.push(room_id);
        }

        if (inventory_id) {
            query += " AND it.inventory_id = ?";
            params.push(inventory_id);
        }

        if (transaction_type) {
            query += " AND it.transaction_type = ?";
            params.push(transaction_type);
        }

        if (start_date && end_date) {
            query += " AND it.transaction_date BETWEEN ? AND ?";
            params.push(start_date, end_date);
        }

        query += " ORDER BY it.created_at DESC LIMIT ?";
        params.push(Number(limit));

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching inventory transactions:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
    }
};

const createInventoryTransaction = async (req, res) => {
    try {
        const {
            inventory_id,
            inventory_calendar_id,
            property_id,
            room_id,
            transaction_date,
            transaction_type,
            transaction_direction,
            quantity = 1,
            previous_available_units = 0,
            new_available_units = 0,
            previous_booked_units = 0,
            new_booked_units = 0,
            previous_blocked_units = 0,
            new_blocked_units = 0,
            previous_maintenance_units = 0,
            new_maintenance_units = 0,
            previous_stop_sell_units = 0,
            new_stop_sell_units = 0,
            reference_type,
            reference_id,
            reference_uuid,
            reason,
            remarks,
            source = "System"
        } = req.body;

        if (!inventory_id || !property_id || !room_id || !transaction_date || !transaction_type || !transaction_direction) {
            return res.status(400).json({
                success: false,
                message: "inventory_id, property_id, room_id, transaction_date, transaction_type, and transaction_direction are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO inventory_transactions (
                inventory_id, inventory_calendar_id, property_id, room_id,
                transaction_date, transaction_type, transaction_direction, quantity,
                previous_available_units, new_available_units, previous_booked_units,
                new_booked_units, previous_blocked_units, new_blocked_units,
                previous_maintenance_units, new_maintenance_units, previous_stop_sell_units,
                new_stop_sell_units, reference_type, reference_id, reference_uuid,
                reason, remarks, source, performed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                inventory_id, inventory_calendar_id || null, property_id, room_id,
                transaction_date, transaction_type, transaction_direction, quantity,
                previous_available_units, new_available_units, previous_booked_units,
                new_booked_units, previous_blocked_units, new_blocked_units,
                previous_maintenance_units, new_maintenance_units, previous_stop_sell_units,
                new_stop_sell_units, reference_type || null, reference_id || null, reference_uuid || null,
                reason || null, remarks || null, source, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM inventory_transactions WHERE inventory_transaction_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Transaction recorded", data: created[0] });
    } catch (error) {
        console.error("Error recording inventory transaction:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to record transaction" });
    }
};

module.exports = {
    getInventoryTransactions,
    createInventoryTransaction
};
