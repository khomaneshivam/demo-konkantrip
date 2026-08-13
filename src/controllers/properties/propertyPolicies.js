const db = require("../../config/db");

const getPropertyPolicies = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            "SELECT * FROM property_policies WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
            [propertyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Policies not found for this property" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error fetching property policies:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch property policies" });
    }
};

const upsertPropertyPolicies = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const body = { ...req.body };
        delete body.policy_id;
        delete body.policy_uuid;
        delete body.property_id;

        const [existing] = await db.query(
            "SELECT policy_id FROM property_policies WHERE property_id = ? LIMIT 1",
            [propertyId]
        );

        if (existing.length === 0) {
            const fields = ["property_id", "created_by", ...Object.keys(body)];
            const values = [propertyId, req.user?.p_owner_id || req.user?.admin_id || null, ...Object.values(body)];
            const placeholders = fields.map(() => "?").join(", ");

            await db.query(`INSERT INTO property_policies (${fields.join(", ")}) VALUES (${placeholders})`, values);
        } else {
            const updateFields = Object.keys(body);
            if (updateFields.length > 0) {
                const setClauses = updateFields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?";
                const values = [...Object.values(body), req.user?.p_owner_id || req.user?.admin_id || null, propertyId];
                await db.query(`UPDATE property_policies SET ${setClauses} WHERE property_id = ? AND delete_status = FALSE`, values);
            }
        }

        const [saved] = await db.query("SELECT * FROM property_policies WHERE property_id = ? AND delete_status = FALSE LIMIT 1", [propertyId]);
        return res.status(200).json({ success: true, message: "Policies saved successfully", data: saved[0] });
    } catch (error) {
        console.error("Error saving property policies:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to save policies" });
    }
};

module.exports = {
    getPropertyPolicies,
    upsertPropertyPolicies
};
