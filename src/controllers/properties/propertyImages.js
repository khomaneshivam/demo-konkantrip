const db = require("../../config/db");

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
        const {
            image_type_id,
            image_title,
            image_alt_text,
            storage_provider = "AWS_S3",
            storage_bucket,
            storage_key,
            cdn_url,
            thumbnail_url,
            mime_type,
            file_extension,
            file_size,
            image_width,
            image_height,
            image_order = 1,
            is_cover_image = false,
            is_active = true
        } = req.body;

        if (!image_type_id || !cdn_url) {
            return res.status(400).json({ success: false, message: "image_type_id and cdn_url are required" });
        }

        // If setting this image as cover, unset other cover images for this property
        if (is_cover_image) {
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
                storage_provider, storage_bucket || null, storage_key || null, cdn_url,
                thumbnail_url || null, mime_type || null, file_extension || null, file_size || null,
                image_width || null, image_height || null, image_order, is_cover_image,
                is_active, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM property_images WHERE image_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Image added successfully", data: created[0] });
    } catch (error) {
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

        const [existing] = await db.query("SELECT property_id FROM property_images WHERE image_id = ?", [imageId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Image not found" });
        }

        if (is_cover_image) {
            await db.query("UPDATE property_images SET is_cover_image = FALSE WHERE property_id = ?", [existing[0].property_id]);
        }

        const [result] = await db.query(
            `UPDATE property_images
             SET image_type_id = COALESCE(?, image_type_id),
                 image_title = COALESCE(?, image_title),
                 image_alt_text = COALESCE(?, image_alt_text),
                 image_order = COALESCE(?, image_order),
                 is_cover_image = COALESCE(?, is_cover_image),
                 is_active = COALESCE(?, is_active)
             WHERE image_id = ?`,
            [image_type_id, image_title, image_alt_text, image_order, is_cover_image, is_active, imageId]
        );

        const [updated] = await db.query("SELECT * FROM property_images WHERE image_id = ?", [imageId]);
        return res.status(200).json({ success: true, message: "Image updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating image:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update image" });
    }
};

const deletePropertyImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const [result] = await db.query("DELETE FROM property_images WHERE image_id = ?", [imageId]);
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
