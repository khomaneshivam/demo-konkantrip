const db = require("../../config/db");

const getPropertyHouseRules = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT phr.*, cat.category_name, cat.category_icon as default_category_icon
             FROM property_house_rules phr
             LEFT JOIN property_house_rule_categories cat ON cat.rule_category_id = phr.rule_category_id
             WHERE phr.property_id = ? AND phr.delete_status = FALSE
             ORDER BY phr.display_order ASC, phr.created_at ASC`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching house rules:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch house rules" });
    }
};

const addPropertyHouseRule = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const {
            rule_category_id,
            rule_title,
            rule_description,
            rule_icon,
            display_order = 1,
            is_mandatory = false,
            is_highlight = false,
            applies_to_children = false,
            applies_to_pets = false,
            applies_to_visitors = false,
            penalty_amount = 0.00,
            penalty_description,
            effective_from,
            effective_to,
            is_active = true
        } = req.body;

        if (!rule_category_id || !rule_title) {
            return res.status(400).json({ success: false, message: "rule_category_id and rule_title are required" });
        }

        const [result] = await db.query(
            `INSERT INTO property_house_rules (
                property_id, rule_category_id, rule_title, rule_description,
                rule_icon, display_order, is_mandatory, is_highlight,
                applies_to_children, applies_to_pets, applies_to_visitors,
                penalty_amount, penalty_description, effective_from, effective_to,
                is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                propertyId, rule_category_id, rule_title, rule_description || null,
                rule_icon || null, display_order, is_mandatory, is_highlight,
                applies_to_children, applies_to_pets, applies_to_visitors,
                penalty_amount, penalty_description || null, effective_from || null, effective_to || null,
                is_active, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM property_house_rules WHERE rule_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "House rule added", data: created[0] });
    } catch (error) {
        console.error("Error adding house rule:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add house rule" });
    }
};

const updatePropertyHouseRule = async (req, res) => {
    try {
        const { ruleId } = req.params;
        const body = { ...req.body };
        delete body.rule_id;
        delete body.rule_uuid;
        delete body.property_id;

        const fields = Object.keys(body);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const setClauses = fields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?";
        const values = [...Object.values(body), req.user?.p_owner_id || req.user?.admin_id || null, ruleId];

        const [result] = await db.query(
            `UPDATE property_house_rules SET ${setClauses} WHERE rule_id = ? AND delete_status = FALSE`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "House rule not found" });
        }

        const [updated] = await db.query("SELECT * FROM property_house_rules WHERE rule_id = ?", [ruleId]);
        return res.status(200).json({ success: true, message: "House rule updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating house rule:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update house rule" });
    }
};

const deletePropertyHouseRule = async (req, res) => {
    try {
        const { ruleId } = req.params;
        const [result] = await db.query(
            "UPDATE property_house_rules SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE rule_id = ?",
            [req.user?.p_owner_id || req.user?.admin_id || null, ruleId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "House rule not found" });
        }

        return res.status(200).json({ success: true, message: "House rule deleted" });
    } catch (error) {
        console.error("Error deleting house rule:", error);
        return res.status(500).json({ success: false, message: "Failed to delete house rule" });
    }
};

module.exports = {
    getPropertyHouseRules,
    addPropertyHouseRule,
    updatePropertyHouseRule,
    deletePropertyHouseRule
};
