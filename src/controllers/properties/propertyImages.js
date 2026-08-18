const path = require("path");
const fs = require("fs").promises;
const db = require("../../config/db");
const { normalizeStorageProvider } = require("../../middlewares/uploadMiddleware");

const cleanupUploadedFile = async (file) => {
    if (file && file.path) {
        try {
            await fs.unlink(file.path);
        } catch (_) {}
    }
};

const getPropertyImages = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT pi.*, pit.image_type_name
             FROM property_images pi
             LEFT JOIN property_image_types pit ON pit.image_type_id = pi.image_type_id
             WHERE pi.property_id = ? AND pi.is_active = TRUE
             ORDER BY pi.is_cover_image DESC, pi.image_order ASC, pi.created_at ASC`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching property images:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch images" });
    }
};

const addPropertyImage = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const body = req.body || {};
        const file = req.file;

        const relativePath = file ? `/uploads/properties/${file.filename}` : null;
        const finalCdnUrl = body.cdn_url || body.url || relativePath;

        let parsedFilename = null;
        if (finalCdnUrl) {
            try {
                parsedFilename = path.basename(new URL(finalCdnUrl, "http://localhost").pathname);
            } catch (_) {}
        }

        let original_name = file ? file.originalname : (body.original_file_name || body.original_name || parsedFilename || "Property Image");
        let stored_name = file ? file.filename : (body.stored_file_name || body.storage_key || parsedFilename || original_name);
        let ext = file ? path.extname(file.originalname).toLowerCase() : (body.file_extension || (parsedFilename ? path.extname(parsedFilename).toLowerCase() : null));
        let mime = file ? file.mimetype : (body.mime_type || null);
        let size = file ? file.size : (body.file_size || null);

        const {
            image_type_id = 1,
            image_title = original_name || "Property Image",
            image_alt_text,
            storage_provider = file ? "LOCAL" : "AWS_S3",
            storage_bucket = "uploads/properties",
            storage_key = stored_name,
            cdn_url = finalCdnUrl,
            thumbnail_url = finalCdnUrl,
            mime_type = mime,
            file_extension = ext,
            file_size = size,
            image_width,
            image_height,
            image_order = 1,
            is_cover_image = false,
            is_active = true
        } = body;

        if (!image_type_id || !finalCdnUrl) {
            return res.status(400).json({ success: false, message: "image_type_id and image file/cdn_url (or url) are required" });
        }

        const normalizedProvider = normalizeStorageProvider(storage_provider);

        // If setting this image as cover, unset other cover images for this property
        if (is_cover_image === "true" || is_cover_image === true) {
            await db.query("UPDATE property_images SET is_cover_image = FALSE WHERE property_id = ?", [propertyId]);
        }

        const [result] = await db.query(
            `INSERT INTO property_images (
                property_id, image_type_id, image_title, image_alt_text,
                storage_provider, storage_bucket, storage_key, cdn_url,
                thumbnail_url, mime_type, file_extension, file_size,
                image_width, image_height, image_order, is_cover_image,
                is_active, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                propertyId, image_type_id, image_title || null, image_alt_text || null,
                normalizedProvider, storage_bucket || "uploads/properties", storage_key || null, finalCdnUrl,
                thumbnail_url || finalCdnUrl, mime_type || null, file_extension || null, file_size || null,
                image_width || null, image_height || null, Number(image_order) || 1, is_cover_image === "true" || is_cover_image === true,
                is_active !== false && is_active !== "false", req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM property_images WHERE image_id = ? AND is_active = TRUE", [result.insertId]);
        return res.status(201).json({ success: true, message: "Image added successfully", data: created[0] });
    } catch (error) {
        await cleanupUploadedFile(req.file);
        console.error("Error adding property image:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add image" });
    }
};

const updatePropertyImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const {
            image_type_id,
            image_title,
            image_alt_text,
            image_order,
            is_cover_image,
            is_active
        } = req.body;

        const [existing] = await db.query("SELECT property_id FROM property_images WHERE image_id = ? AND is_active = TRUE", [imageId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Image not found" });
        }

        if (is_cover_image === "true" || is_cover_image === true) {
            await db.query("UPDATE property_images SET is_cover_image = FALSE WHERE property_id = ? AND is_active = TRUE", [existing[0].property_id]);
        }

        const [result] = await db.query(
            `UPDATE property_images
             SET image_type_id = COALESCE(?, image_type_id),
                 image_title = COALESCE(?, image_title),
                 image_alt_text = COALESCE(?, image_alt_text),
                 image_order = COALESCE(?, image_order),
                 is_cover_image = COALESCE(?, is_cover_image),
                 is_active = COALESCE(?, is_active)
             WHERE image_id = ? AND is_active = TRUE`,
            [image_type_id, image_title, image_alt_text, image_order, is_cover_image, is_active, imageId]
        );

        const [updated] = await db.query("SELECT * FROM property_images WHERE image_id = ? AND is_active = TRUE", [imageId]);
        return res.status(200).json({ success: true, message: "Image updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating image:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update image" });
    }
};

const deletePropertyImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const [result] = await db.query("UPDATE property_images SET is_active = FALSE WHERE image_id = ? AND is_active = TRUE", [imageId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Image not found" });
        }
        return res.status(200).json({ success: true, message: "Image deleted" });
    } catch (error) {
        console.error("Error deleting image:", error);
        return res.status(500).json({ success: false, message: "Failed to delete image" });
    }
};

module.exports = {
    getPropertyImages,
    addPropertyImage,
    updatePropertyImage,
    deletePropertyImage
};
