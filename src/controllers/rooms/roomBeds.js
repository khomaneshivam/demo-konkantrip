const db = require("../../config/db");

const getRoomBeds = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [rows] = await db.query(
            `SELECT rb.*, bt.bed_type_name, bt.bed_size, bt.width_cm, bt.length_cm, bt.maximum_occupancy
             FROM room_beds rb
             INNER JOIN bed_types bt ON bt.bed_type_id = rb.bed_type_id
             WHERE rb.room_id = ? AND rb.delete_status = FALSE
             ORDER BY rb.is_default DESC, rb.created_at ASC`,
            [roomId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching room beds:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch room beds" });
    }
};

const addRoomBed = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const {
            bed_type_id,
            quantity = 1,
            bed_position = "Primary",
            is_default = false,
            is_extra_bed = false,
            additional_charge = 0.00,
            remarks,
            is_active = true
        } = req.body;

        if (!bed_type_id) {
            return res.status(400).json({ success: false, message: "bed_type_id is required" });
        }

        const [result] = await db.query(
            `INSERT INTO room_beds (
                room_id, bed_type_id, quantity, bed_position,
                is_default, is_extra_bed, additional_charge, remarks,
                is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                roomId, bed_type_id, quantity, bed_position,
                is_default, is_extra_bed, additional_charge, remarks || null,
                is_active, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM room_beds WHERE room_bed_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Room bed added", data: created[0] });
    } catch (error) {
        console.error("Error adding room bed:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add room bed" });
    }
};

const updateRoomBed = async (req, res) => {
    try {
        const { bedId } = req.params;
        const body = { ...req.body };
        delete body.room_bed_id;
        delete body.room_bed_uuid;
        delete body.room_id;

        const fields = Object.keys(body);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const setClauses = fields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?";
        const values = [...Object.values(body), req.user?.p_owner_id || req.user?.admin_id || null, bedId];

        const [result] = await db.query(`UPDATE room_beds SET ${setClauses} WHERE room_bed_id = ? AND delete_status = FALSE`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room bed not found" });
        }

        const [updated] = await db.query("SELECT * FROM room_beds WHERE room_bed_id = ?", [bedId]);
        return res.status(200).json({ success: true, message: "Room bed updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating room bed:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update room bed" });
    }
};

const deleteRoomBed = async (req, res) => {
    try {
        const { bedId } = req.params;
        const [result] = await db.query(
            "UPDATE room_beds SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE room_bed_id = ?",
            [req.user?.p_owner_id || req.user?.admin_id || null, bedId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room bed not found" });
        }

        return res.status(200).json({ success: true, message: "Room bed deleted" });
    } catch (error) {
        console.error("Error deleting room bed:", error);
        return res.status(500).json({ success: false, message: "Failed to delete room bed" });
    }
};

module.exports = {
    getRoomBeds,
    addRoomBed,
    updateRoomBed,
    deleteRoomBed
};
