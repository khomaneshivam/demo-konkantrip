const db = require("../../config/db");
const { syncCalendarForDateRange, recordTransaction } = require("../../services/inventorySyncService");

const getRoomBlocks = async (req, res) => {
    try {
        const { property_id, room_id, status, include_cancelled } = req.query;
        let query = `
            SELECT rb.*, r.room_name, r.room_code, p.property_name
            FROM room_blocks rb
            INNER JOIN rooms r ON r.room_id = rb.room_id
            INNER JOIN properties p ON p.property_id = rb.property_id
            WHERE r.delete_status = FALSE AND p.delete_status = FALSE
        `;
        const params = [];

        if (property_id) {
            query += " AND rb.property_id = ?";
            params.push(property_id);
        }

        if (room_id) {
            query += " AND rb.room_id = ?";
            params.push(room_id);
        }

        if (status) {
            query += " AND rb.status = ?";
            params.push(status);
        } else if (include_cancelled !== "true") {
            query += " AND rb.status != 'Cancelled'";
        }

        query += " ORDER BY rb.start_date DESC, rb.created_at DESC";

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching room blocks:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch room blocks" });
    }
};

const createRoomBlock = async (req, res) => {
    try {
        const {
            property_id,
            room_id,
            inventory_id,
            block_reference,
            block_type = "Operational",
            block_reason,
            start_date,
            end_date,
            blocked_units = 1,
            release_automatically = false,
            status = "Scheduled",
            affects_inventory = true,
            affects_booking = true,
            affects_checkin = true,
            remarks
        } = req.body;

        if (!property_id || !room_id || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: "property_id, room_id, start_date, and end_date are required"
            });
        }

        const userId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;

        const [result] = await db.query(
            `INSERT INTO room_blocks (
                property_id, room_id, inventory_id, block_reference,
                block_type, block_reason, start_date, end_date,
                blocked_units, release_automatically, status,
                affects_inventory, affects_booking, affects_checkin,
                remarks, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                property_id, room_id, inventory_id || null, block_reference || null,
                block_type, block_reason || null, start_date, end_date,
                blocked_units, release_automatically, status,
                affects_inventory, affects_booking, affects_checkin,
                remarks || null, userId
            ]
        );

        // Auto-sync calendar for the date range so overview immediately reflects this block
        if (affects_inventory) {
            await syncCalendarForDateRange(property_id, room_id, start_date, end_date, userId);
        }

        // Record audit transaction
        await recordTransaction({
            propertyId: property_id,
            roomId: room_id,
            inventoryId: inventory_id || null,
            transactionDate: start_date,
            transactionType: "Blocked",
            transactionDirection: "Reduction",
            quantity: blocked_units,
            previousBlocked: 0,
            newBlocked: blocked_units,
            reason: `Room block created: ${block_reason || block_type} (${start_date} to ${end_date})`,
            remarks,
            source: "Web",
            performedBy: userId
        });

        const [created] = await db.query("SELECT * FROM room_blocks WHERE room_block_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Room block created", data: created[0] });
    } catch (error) {
        console.error("Error creating room block:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create room block" });
    }
};

const { isAdmin } = require("../../middlewares/roleMiddleware");

const releaseRoomBlock = async (req, res) => {
    try {
        const { blockId } = req.params;
        const currentUserId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;

        const [blockRows] = await db.query(
            `SELECT b.*, p.p_owner_id 
             FROM room_blocks b 
             INNER JOIN properties p ON p.property_id = b.property_id 
             WHERE b.room_block_id = ? AND b.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [blockId]
        );
        if (blockRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room block not found" });
        }
        const block = blockRows[0];

        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(block.p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(block.property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to modify blocks for this property" });
            }
        }

        const [result] = await db.query(
            `UPDATE room_blocks
             SET status = 'Released',
                 released_by = ?,
                 released_at = NOW(),
                 updated_by = ?
             WHERE room_block_id = ? AND status IN ('Scheduled', 'Active')`,
            [currentUserId, currentUserId, blockId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Block is already released or cancelled" });
        }

        // Sync calendar after block release
        await syncCalendarForDateRange(block.property_id, block.room_id, block.start_date, block.end_date, currentUserId);

        const [updated] = await db.query("SELECT * FROM room_blocks WHERE room_block_id = ?", [blockId]);
        return res.status(200).json({ success: true, message: "Room block released", data: updated[0] });
    } catch (error) {
        console.error("Error releasing room block:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to release room block" });
    }
};

const cancelRoomBlock = async (req, res) => {
    try {
        const { blockId } = req.params;
        const currentUserId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;

        const [blockRows] = await db.query(
            `SELECT b.*, p.p_owner_id 
             FROM room_blocks b 
             INNER JOIN properties p ON p.property_id = b.property_id 
             WHERE b.room_block_id = ? AND b.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [blockId]
        );
        if (blockRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room block not found" });
        }
        const block = blockRows[0];

        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(block.p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(block.property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to modify blocks for this property" });
            }
        }

        const [result] = await db.query(
            `UPDATE room_blocks
             SET status = 'Cancelled',
                 cancelled_by = ?,
                 cancelled_at = NOW(),
                 updated_by = ?
             WHERE room_block_id = ? AND status IN ('Scheduled', 'Active')`,
            [currentUserId, currentUserId, blockId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Block is already released or cancelled" });
        }

        // Sync calendar after block cancellation
        await syncCalendarForDateRange(block.property_id, block.room_id, block.start_date, block.end_date, currentUserId);

        return res.status(200).json({ success: true, message: "Room block cancelled" });
    } catch (error) {
        console.error("Error cancelling room block:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to cancel room block" });
    }
};

module.exports = {
    getRoomBlocks,
    createRoomBlock,
    releaseRoomBlock,
    cancelRoomBlock
};
