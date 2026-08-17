const db = require("../../config/db");

const getPropertyAmenities = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT pa.*, a.amenity_name, a.amenity_icon, a.amenity_description, a.is_popular, c.category_name
             FROM property_amenities pa
             INNER JOIN amenities a ON a.amenity_id = pa.amenity_id
             LEFT JOIN amenity_categories c ON c.amenity_category_id = a.amenity_category_id
             WHERE pa.property_id = ? AND pa.is_available = TRUE AND a.status = TRUE AND (c.status IS NULL OR c.status = TRUE)
             ORDER BY c.display_order ASC, a.display_order ASC`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching property amenities:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch property amenities" });
    }
};

const setPropertyAmenities = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const { amenities } = req.body; // Array of { amenity_id, is_available, remarks }

        if (!Array.isArray(amenities)) {
            return res.status(400).json({ success: false, message: "amenities must be an array" });
        }

        const userId = req.user?.p_owner_id || req.user?.admin_id || null;

        // Soft-deactivate existing amenities for this property
        await db.query("UPDATE property_amenities SET is_available = FALSE WHERE property_id = ?", [propertyId]);

        if (amenities.length > 0) {
            for (const a of amenities) {
                await db.query(
                    `INSERT INTO property_amenities (property_id, amenity_id, is_available, remarks, created_by)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE is_available = VALUES(is_available), remarks = VALUES(remarks)`,
                    [propertyId, a.amenity_id, a.is_available !== false, a.remarks || null, userId]
                );
            }
        }

        const [rows] = await db.query(
            `SELECT pa.*, a.amenity_name, a.amenity_icon
             FROM property_amenities pa
             INNER JOIN amenities a ON a.amenity_id = pa.amenity_id
             WHERE pa.property_id = ? AND pa.is_available = TRUE AND a.status = TRUE`,
            [propertyId]
        );

        return res.status(200).json({ success: true, message: "Property amenities updated", data: rows });
    } catch (error) {
        console.error("Error setting property amenities:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update amenities" });
    }
};

const deletePropertyAmenity = async (req, res) => {
    try {
        const { propertyId, amenityId } = req.params;
        const [result] = await db.query(
            "UPDATE property_amenities SET is_available = FALSE WHERE property_id = ? AND amenity_id = ? AND is_available = TRUE",
            [propertyId, amenityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Amenity mapping not found" });
        }

        return res.status(200).json({ success: true, message: "Amenity removed from property" });
    } catch (error) {
        console.error("Error removing property amenity:", error);
        return res.status(500).json({ success: false, message: "Failed to remove amenity" });
    }
};

module.exports = {
    getPropertyAmenities,
    setPropertyAmenities,
    deletePropertyAmenity
};
