const path = require("path");
const fs = require("fs").promises;
const db = require("../../config/db");
const { normalizeStorageProvider } = require("../../middlewares/uploadMiddleware");
const { isAdmin } = require("../../middlewares/roleMiddleware");

const cleanupUploadedFile = async (file) => {
    if (file && file.path) {
        try {
            await fs.unlink(file.path);
        } catch (_) {}
    }
};

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
        
        // Verify room access
        const [roomRows] = await db.query(
            `SELECT r.room_id, r.property_id, p.p_owner_id 
             FROM rooms r 
             INNER JOIN properties p ON p.property_id = r.property_id 
             WHERE r.room_id = ? AND r.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [roomId]
        );

        if (roomRows.length === 0) {
            await cleanupUploadedFile(req.file);
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        const room = roomRows[0];
        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(room.p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(room.property_id))
            );
            if (!isOwner && !isEmployee) {
                await cleanupUploadedFile(req.file);
                return res.status(403).json({ success: false, message: "Unauthorized to add images for this room" });
            }
        }

        const body = req.body || {};
        const file = req.file || req.files?.file?.[0] || req.files?.image?.[0] || req.files?.photo?.[0];

        const defaultPort = process.env.PORT || 3000;
        const host = (typeof req.get === "function" ? req.get("host") : req.headers?.host) || `localhost:${defaultPort}`;
        const protocol = req.protocol || "http";
        const generatedUrl = file ? `${protocol}://${host}/uploads/rooms/${file.filename}` : null;
        const generatedPath = file ? `/uploads/rooms/${file.filename}` : null;
        const finalCdnUrl = body.cdn_url || body.image_url || body.url || body.storage_path || generatedPath || generatedUrl;

        if (!finalCdnUrl) {
            return res.status(400).json({
                success: false,
                message: "Room image file or cdn_url (or url) is required"
            });
        }

        let parsedFilename = null;
        if (finalCdnUrl) {
            try {
                parsedFilename = path.basename(new URL(finalCdnUrl, "http://localhost").pathname);
            } catch (_) {}
        }

        let original_file_name = file ? file.originalname : (body.original_file_name || parsedFilename || "Room Image");
        let stored_file_name = file ? file.filename : (body.stored_file_name || parsedFilename || original_file_name);
        let file_extension = file ? path.extname(file.originalname).toLowerCase() : (body.file_extension || (parsedFilename ? path.extname(parsedFilename) : ".jpg"));
        let mime_type = file ? file.mimetype : (body.mime_type || "image/jpeg");
        let file_size = file ? file.size : (Number(body.file_size) || 0);

        const {
            room_image_type_id = 1,
            image_title,
            image_description,
            image_alt_text,
            image_caption,
            image_width,
            image_height,
            aspect_ratio,
            storage_provider = "LOCAL",
            storage_bucket,
            storage_path,
            thumbnail_url,
            webp_url,
            avif_url,
            is_cover_image = false,
            is_featured = false,
            is_primary = false,
            display_order = 1,
            image_tags,
            remarks,
            is_active = true
        } = body;

        const normalizedProvider = normalizeStorageProvider(storage_provider);

        if (is_cover_image === "true" || is_cover_image === true) {
            await db.query("UPDATE room_images SET is_cover_image = FALSE WHERE room_id = ? AND delete_status = FALSE", [roomId]);
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
                image_width || null, image_height || null, aspect_ratio || null, normalizedProvider, storage_bucket || "uploads/rooms", storage_path || null,
                finalCdnUrl, thumbnail_url || finalCdnUrl, webp_url || null, avif_url || null, is_cover_image === "true" || is_cover_image === true, is_featured === "true" || is_featured === true, is_primary === "true" || is_primary === true,
                is_active !== false && is_active !== "false", Number(display_order) || 1, image_tags || null, remarks || null, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM room_images WHERE room_image_id = ? AND delete_status = FALSE", [result.insertId]);
        return res.status(201).json({ success: true, message: "Room image added", data: created[0] });
    } catch (error) {
        await cleanupUploadedFile(req.file);
        console.error("Error adding room image:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add room image" });
    }
};

const updateRoomImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        
        // Verify image and room access
        const [imgRows] = await db.query(
            `SELECT ri.*, r.property_id, p.p_owner_id 
             FROM room_images ri 
             INNER JOIN rooms r ON r.room_id = ri.room_id 
             INNER JOIN properties p ON p.property_id = r.property_id 
             WHERE ri.room_image_id = ? AND ri.delete_status = FALSE AND r.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [imageId]
        );

        if (imgRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room image not found" });
        }

        const img = imgRows[0];
        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(img.p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(img.property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to update image for this room" });
            }
        }

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

        const [updated] = await db.query("SELECT * FROM room_images WHERE room_image_id = ? AND delete_status = FALSE", [imageId]);
        return res.status(200).json({ success: true, message: "Room image updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating room image:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update image" });
    }
};

const deleteRoomImage = async (req, res) => {
    try {
        const { imageId } = req.params;

        // Verify image and room access
        const [imgRows] = await db.query(
            `SELECT ri.*, r.property_id, p.p_owner_id 
             FROM room_images ri 
             INNER JOIN rooms r ON r.room_id = ri.room_id 
             INNER JOIN properties p ON p.property_id = r.property_id 
             WHERE ri.room_image_id = ? AND ri.delete_status = FALSE AND r.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [imageId]
        );

        if (imgRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room image not found" });
        }

        const img = imgRows[0];
        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(img.p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(img.property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to delete image for this room" });
            }
        }

        const [result] = await db.query(
            "UPDATE room_images SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE room_image_id = ? AND delete_status = FALSE",
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
