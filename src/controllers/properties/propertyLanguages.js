const db = require("../../config/db");

const getPropertyLanguages = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT pl.*, l.language_name, l.native_name, l.iso_639_1, l.flag_icon
             FROM property_languages pl
             INNER JOIN languages l ON l.language_id = pl.language_id
             WHERE pl.property_id = ? AND pl.delete_status = FALSE
             ORDER BY pl.is_primary DESC, l.language_name ASC`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching property languages:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch property languages" });
    }
};

const addPropertyLanguage = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const {
            language_id,
            language_type = "Staff",
            proficiency_level = "Fluent",
            is_primary = false,
            is_active = true,
            remarks
        } = req.body;

        if (!language_id) {
            return res.status(400).json({ success: false, message: "language_id is required" });
        }

        const [result] = await db.query(
            `INSERT INTO property_languages (
                property_id, language_id, language_type, proficiency_level,
                is_primary, is_active, remarks, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                propertyId, language_id, language_type, proficiency_level,
                is_primary, is_active, remarks || null, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM property_languages WHERE property_language_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Language added", data: created[0] });
    } catch (error) {
        console.error("Error adding property language:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add language" });
    }
};

const deletePropertyLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            "UPDATE property_languages SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE property_language_id = ?",
            [req.user?.p_owner_id || req.user?.admin_id || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Language not found" });
        }

        return res.status(200).json({ success: true, message: "Language removed" });
    } catch (error) {
        console.error("Error removing property language:", error);
        return res.status(500).json({ success: false, message: "Failed to remove language" });
    }
};

module.exports = {
    getPropertyLanguages,
    addPropertyLanguage,
    deletePropertyLanguage
};
