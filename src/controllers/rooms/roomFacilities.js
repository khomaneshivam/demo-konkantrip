const db = require("../../config/db");

const getRoomFacilities = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [rows] = await db.query(
            `SELECT rfm.*, rf.facility_name, rf.facility_slug, rf.facility_icon, rfc.category_name
             FROM room_facilities_mapping rfm
             INNER JOIN room_facilities rf ON rf.room_facility_id = rfm.room_facility_id
             LEFT JOIN room_facility_categories rfc ON rfc.room_facility_category_id = rf.room_facility_category_id
             WHERE rfm.room_id = ? AND rfm.delete_status = FALSE AND rf.is_active = TRUE AND (rfc.is_active IS NULL OR rfc.is_active = TRUE)
             ORDER BY rfm.display_order ASC`,
            [roomId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching room facilities:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch room facilities" });
    }
};

const addRoomFacility = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const {
            room_facility_id,
            facility_value,
            is_available = true,
            is_complimentary = true,
            additional_charge = 0.00,
            remarks,
            display_order = 1,
            is_active = true
        } = req.body;

        if (!room_facility_id) {
            return res.status(400).json({ success: false, message: "room_facility_id is required" });
        }

        const [result] = await db.query(
            `INSERT INTO room_facilities_mapping (
                room_id, room_facility_id, facility_value, is_available,
                is_complimentary, additional_charge, remarks, display_order,
                is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                facility_value = VALUES(facility_value),
                is_available = VALUES(is_available),
                is_complimentary = VALUES(is_complimentary),
                additional_charge = VALUES(additional_charge),
                remarks = VALUES(remarks),
                display_order = VALUES(display_order),
                is_active = VALUES(is_active),
                delete_status = FALSE,
                updated_by = VALUES(created_by)`,
            [
                roomId, room_facility_id, facility_value || null, is_available,
                is_complimentary, additional_charge, remarks || null, display_order,
                is_active, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        return res.status(201).json({ success: true, message: "Room facility mapped successfully" });
    } catch (error) {
        console.error("Error mapping room facility:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to map room facility" });
    }
};

const deleteRoomFacility = async (req, res) => {
    try {
        const { roomId, facilityId } = req.params;
        const [result] = await db.query(
            "UPDATE room_facilities_mapping SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE room_id = ? AND room_facility_id = ? AND delete_status = FALSE",
            [req.user?.p_owner_id || req.user?.admin_id || null, roomId, facilityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Facility mapping not found" });
        }

        return res.status(200).json({ success: true, message: "Room facility deleted" });
    } catch (error) {
        console.error("Error deleting room facility:", error);
        return res.status(500).json({ success: false, message: "Failed to delete room facility" });
    }
};

module.exports = {
    getRoomFacilities,
    addRoomFacility,
    deleteRoomFacility
};
