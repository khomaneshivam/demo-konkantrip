const db = require("../../config/db");

const getRoomInventory = async (req, res) => {
    try {
        const { property_id, room_id } = req.query;
        let query = `
            SELECT ri.*, r.room_name, r.room_code, p.property_name
            FROM room_inventory ri
            INNER JOIN rooms r ON r.room_id = ri.room_id
            INNER JOIN properties p ON p.property_id = ri.property_id
            WHERE ri.delete_status = FALSE AND r.delete_status = FALSE AND p.delete_status = FALSE
        `;
        const params = [];

        if (property_id) {
            query += " AND ri.property_id = ?";
            params.push(property_id);
        }

        if (room_id) {
            query += " AND ri.room_id = ?";
            params.push(room_id);
        }

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching room inventory:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch inventory" });
    }
};

const getRoomInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT ri.*, r.room_name, r.room_code, p.property_name
             FROM room_inventory ri
             INNER JOIN rooms r ON r.room_id = ri.room_id
             INNER JOIN properties p ON p.property_id = ri.property_id
             WHERE ri.inventory_id = ? AND ri.delete_status = FALSE AND r.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Inventory record not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error fetching inventory by ID:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch inventory" });
    }
};

const upsertRoomInventory = async (req, res) => {
    try {
        const {
            room_id,
            property_id,
            inventory_code,
            total_units = 1,
            sellable_units = 1,
            minimum_stock = 0,
            maximum_stock,
            overbooking_allowed = false,
            overbooking_limit = 0,
            inventory_mode = "Room Based",
            allocation_mode = "Automatic",
            remarks
        } = req.body;

        if (!room_id || !property_id || !inventory_code) {
            return res.status(400).json({
                success: false,
                message: "room_id, property_id, and inventory_code are required"
            });
        }

        const userId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;

        const [result] = await db.query(
            `INSERT INTO room_inventory (
                room_id, property_id, inventory_code, total_units,
                sellable_units, minimum_stock, maximum_stock, overbooking_allowed,
                overbooking_limit, inventory_mode, allocation_mode, remarks, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                inventory_code = VALUES(inventory_code),
                total_units = VALUES(total_units),
                sellable_units = VALUES(sellable_units),
                minimum_stock = VALUES(minimum_stock),
                maximum_stock = VALUES(maximum_stock),
                overbooking_allowed = VALUES(overbooking_allowed),
                overbooking_limit = VALUES(overbooking_limit),
                inventory_mode = VALUES(inventory_mode),
                allocation_mode = VALUES(allocation_mode),
                remarks = VALUES(remarks),
                delete_status = FALSE,
                updated_by = ?`,
            [
                room_id, property_id, inventory_code, total_units,
                sellable_units, minimum_stock, maximum_stock || null, overbooking_allowed,
                overbooking_limit, inventory_mode, allocation_mode, remarks || null, userId,
                userId
            ]
        );

        const [saved] = await db.query("SELECT * FROM room_inventory WHERE room_id = ? AND delete_status = FALSE LIMIT 1", [room_id]);
        return res.status(200).json({ success: true, message: "Room inventory configured", data: saved[0] });
    } catch (error) {
        console.error("Error upserting room inventory:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to configure inventory" });
    }
};

const deleteRoomInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;
        const [result] = await db.query(
            "UPDATE room_inventory SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE inventory_id = ? AND delete_status = FALSE",
            [currentUserId, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Inventory record not found" });
        }

        return res.status(200).json({ success: true, message: "Inventory deleted" });
    } catch (error) {
        console.error("Error deleting room inventory:", error);
        return res.status(500).json({ success: false, message: "Failed to delete inventory" });
    }
};

module.exports = {
    getRoomInventory,
    getRoomInventoryById,
    upsertRoomInventory,
    deleteRoomInventory
};
