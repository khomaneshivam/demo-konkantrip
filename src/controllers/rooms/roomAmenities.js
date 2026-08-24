const db = require("../../config/db");

const getRoomAmenities = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [rows] = await db.query(
            `SELECT ra.*, a.amenity_name, a.amenity_icon, a.amenity_description
             FROM room_amenities ra
             INNER JOIN amenities a ON a.amenity_id = ra.amenity_id
             WHERE ra.room_id = ? AND ra.delete_status = FALSE AND a.status = TRUE
             ORDER BY ra.display_order ASC`,
            [roomId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching room amenities:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch room amenities" });
    }
};

const { isAdmin } = require("../../middlewares/roleMiddleware");

const addRoomAmenity = async (req, res) => {
    try {
        const roomId = req.params.roomId;

        // Verify room access
        const [roomRows] = await db.query(
            `SELECT r.room_id, r.property_id, p.p_owner_id 
             FROM rooms r 
             INNER JOIN properties p ON p.property_id = r.property_id 
             WHERE r.room_id = ? AND r.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [roomId]
        );

        if (roomRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        const room = roomRows[0];
        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(room.p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(room.property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to map amenities for this room" });
            }
        }

        const {
            amenity_id,
            is_available = true,
            is_complimentary = true,
            additional_charge = 0.00,
            quantity = 1,
            remarks,
            display_order = 1,
            is_active = true
        } = req.body;

        if (!amenity_id) {
            return res.status(400).json({ success: false, message: "amenity_id is required" });
        }

        const [result] = await db.query(
            `INSERT INTO room_amenities (
                room_id, amenity_id, is_available, is_complimentary,
                additional_charge, quantity, remarks, display_order,
                is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                is_available = VALUES(is_available),
                is_complimentary = VALUES(is_complimentary),
                additional_charge = VALUES(additional_charge),
                quantity = VALUES(quantity),
                remarks = VALUES(remarks),
                display_order = VALUES(display_order),
                is_active = VALUES(is_active),
                delete_status = FALSE,
                updated_by = VALUES(created_by)`,
            [
                roomId, amenity_id, is_available, is_complimentary,
                additional_charge, quantity, remarks || null, display_order,
                is_active, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        return res.status(201).json({ success: true, message: "Room amenity mapped successfully" });
    } catch (error) {
        console.error("Error adding room amenity:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add room amenity" });
    }
};

const deleteRoomAmenity = async (req, res) => {
    try {
        const { roomId, amenityId } = req.params;

        // Verify room access
        const [roomRows] = await db.query(
            `SELECT r.room_id, r.property_id, p.p_owner_id 
             FROM rooms r 
             INNER JOIN properties p ON p.property_id = r.property_id 
             WHERE r.room_id = ? AND r.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [roomId]
        );

        if (roomRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        const room = roomRows[0];
        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(room.p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(room.property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to delete amenities for this room" });
            }
        }

        const [result] = await db.query(
            "UPDATE room_amenities SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE room_id = ? AND amenity_id = ? AND delete_status = FALSE",
            [req.user?.p_owner_id || req.user?.admin_id || null, roomId, amenityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Amenity mapping not found" });
        }

        return res.status(200).json({ success: true, message: "Room amenity deleted" });
    } catch (error) {
        console.error("Error deleting room amenity:", error);
        return res.status(500).json({ success: false, message: "Failed to delete room amenity" });
    }
};

module.exports = {
    getRoomAmenities,
    addRoomAmenity,
    deleteRoomAmenity
};
