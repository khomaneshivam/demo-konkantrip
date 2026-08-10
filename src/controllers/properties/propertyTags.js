const db = require("../../config/db");

const getPropertyTags = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT pt.*, t.tag_name, t.tag_slug, t.tag_color
             FROM property_tags pt
             INNER JOIN tags t ON t.tag_id = pt.tag_id
             WHERE pt.property_id = ?`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching property tags:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch property tags" });
    }
};

const setPropertyTags = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const { tag_ids } = req.body; // Array of tag_id numbers

        if (!Array.isArray(tag_ids)) {
            return res.status(400).json({ success: false, message: "tag_ids must be an array" });
        }

        const userId = req.user?.p_owner_id || req.user?.admin_id || null;

        await db.query("DELETE FROM property_tags WHERE property_id = ?", [propertyId]);

        if (tag_ids.length > 0) {
            const values = tag_ids.map(tagId => [propertyId, tagId, userId]);
            await db.query(
                "INSERT INTO property_tags (property_id, tag_id, created_by) VALUES ?",
                [values]
            );
        }

        const [rows] = await db.query(
            `SELECT pt.*, t.tag_name, t.tag_slug, t.tag_color
             FROM property_tags pt
             INNER JOIN tags t ON t.tag_id = pt.tag_id
             WHERE pt.property_id = ?`,
            [propertyId]
        );

        return res.status(200).json({ success: true, message: "Property tags updated", data: rows });
    } catch (error) {
        console.error("Error setting property tags:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update tags" });
    }
};

const removePropertyTag = async (req, res) => {
    try {
        const { propertyId, tagId } = req.params;
        const [result] = await db.query(
            "DELETE FROM property_tags WHERE property_id = ? AND tag_id = ?",
            [propertyId, tagId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Tag not mapped to property" });
        }

        return res.status(200).json({ success: true, message: "Tag removed from property" });
    } catch (error) {
        console.error("Error removing property tag:", error);
        return res.status(500).json({ success: false, message: "Failed to remove tag" });
    }
};

module.exports = {
    getPropertyTags,
    setPropertyTags,
    removePropertyTag
};
