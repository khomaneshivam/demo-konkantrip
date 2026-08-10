const db = require("../../config/db");

const getRoomImages = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [rows] = await db.query(
            `SELECT ri.*, rit.image_type_name
             FROM room_images ri
             LEFT JOIN room_image_types rit ON rit.room_image_type_id = ri.room_image_type_id
             WHERE ri.room_id = ? AND ri.delete_status = FALSE
             ORDER BY ri.is_cover_image DESC, ri.display_order ASC`,
            [roomId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching room images:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch room images" });
    }
};

const addRoomImage = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const {
            room_image_type_id,
            image_title,
            image_description,
            image_alt_text,
            image_caption,
            original_file_name,
            stored_file_name,
            file_extension,
            mime_type,
            file_size,
            image_width,
            image_height,
            aspect_ratio,
            storage_provider = "AWS_S3",
            storage_bucket,
            storage_path,
            cdn_url,
            thumbnail_url,
            webp_url,
            avif_url,
            is_cover_image = false,
            is_featured = false,
            is_primary = false,
            is_active = true,
            display_order = 1,
            image_tags,
            remarks
        } = req.body;

        if (!room_image_type_id || !original_file_name || !stored_file_name || !cdn_url) {
            return res.status(400).json({
                success: false,
                message: "room_image_type_id, original_file_name, stored_file_name, and cdn_url are required"
            });
        }

        if (is_cover_image) {
            await db.query("UPDATE room_images SET is_cover_image = FALSE WHERE room_id = ?", [roomId]);
        }

        const [result] = await db.query(
            `INSERT INTO room_images (
                room_id, room_image_type_id, image_title, image_description, image_alt_text, image_caption,
                original_file_name, stored_file_name, file_extension, mime_type, file_size,
                image_width, image_height, aspect_ratio, storage_provider, storage_bucket, storage_path,
                cdn_url, thumbnail_url, webp_url, avif_url, is_cover_image, is_featured, is_primary,
                is_active, display_order, image_tags, remarks, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                roomId, room_image_type_id, image_title || null, image_description || null, image_alt_text || null, image_caption || null,
                original_file_name, stored_file_name, file_extension || null, mime_type || null, file_size || null,
                image_width || null, image_height || null, aspect_ratio || null, storage_provider, storage_bucket || null, storage_path || null,
                cdn_url, thumbnail_url || null, webp_url || null, avif_url || null, is_cover_image, is_featured, is_primary,
                is_active, display_order, image_tags || null, remarks || null, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM room_images WHERE room_image_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Room image added", data: created[0] });
    } catch (error) {
        console.error("Error adding room image:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add room image" });
    }
};

const updateRoomImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const body = { ...req.body };
        delete body.room_image_id;
        delete body.room_image_uuid;
        delete body.room_id;

        const fields = Object.keys(body);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const setClauses = fields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?";
        const values = [...Object.values(body), req.user?.p_owner_id || req.user?.admin_id || null, imageId];

        const [result] = await db.query(`UPDATE room_images SET ${setClauses} WHERE room_image_id = ? AND delete_status = FALSE`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room image not found" });
        }

        const [updated] = await db.query("SELECT * FROM room_images WHERE room_image_id = ?", [imageId]);
        return res.status(200).json({ success: true, message: "Room image updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating room image:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update image" });
    }
};

const deleteRoomImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const [result] = await db.query(
            "UPDATE room_images SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE room_image_id = ?",
            [req.user?.p_owner_id || req.user?.admin_id || null, imageId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room image not found" });
        }

        return res.status(200).json({ success: true, message: "Room image deleted" });
    } catch (error) {
        console.error("Error deleting room image:", error);
        return res.status(500).json({ success: false, message: "Failed to delete room image" });
    }
};

module.exports = {
    getRoomImages,
    addRoomImage,
    updateRoomImage,
    deleteRoomImage
};
