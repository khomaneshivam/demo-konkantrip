const db = require("../../config/db");

const getPropertyStatistics = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            "SELECT * FROM property_statistics WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
            [propertyId]
        );

        if (rows.length === 0) {
            // Auto-initialize statistics row if not found
            await db.query(
                "INSERT IGNORE INTO property_statistics (property_id, created_by) VALUES (?, ?)",
                [propertyId, req.user?.p_owner_id || req.user?.admin_id || null]
            );
            const [created] = await db.query("SELECT * FROM property_statistics WHERE property_id = ? AND delete_status = FALSE LIMIT 1", [propertyId]);
            return res.status(200).json({ success: true, data: created[0] || {} });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error fetching property statistics:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch statistics" });
    }
};

const incrementPropertyViews = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        await db.query(
            `INSERT INTO property_statistics (property_id, total_views, today_views, weekly_views, monthly_views, yearly_views, unique_visitors, last_viewed_at)
             VALUES (?, 1, 1, 1, 1, 1, 1, NOW())
             ON DUPLICATE KEY UPDATE 
                total_views = total_views + 1,
                today_views = today_views + 1,
                weekly_views = weekly_views + 1,
                monthly_views = monthly_views + 1,
                yearly_views = yearly_views + 1,
                last_viewed_at = NOW()`,
            [propertyId]
        );

        // Also increment total_views in properties table
        await db.query("UPDATE properties SET total_views = total_views + 1 WHERE property_id = ? AND delete_status = FALSE", [propertyId]);

        return res.status(200).json({ success: true, message: "View recorded" });
    } catch (error) {
        console.error("Error recording view:", error);
        return res.status(500).json({ success: false, message: "Failed to record view" });
    }
};

const updatePropertyStatistics = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const body = { ...req.body };
        delete body.statistics_id;
        delete body.statistics_uuid;
        delete body.property_id;

        const fields = Object.keys(body);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const setClauses = fields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?, last_updated_statistics_at = NOW()";
        const values = [...Object.values(body), req.user?.p_owner_id || req.user?.admin_id || null, propertyId];

        await db.query(`UPDATE property_statistics SET ${setClauses} WHERE property_id = ? AND delete_status = FALSE`, values);

        const [updated] = await db.query("SELECT * FROM property_statistics WHERE property_id = ? AND delete_status = FALSE LIMIT 1", [propertyId]);
        return res.status(200).json({ success: true, message: "Statistics updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating statistics:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update statistics" });
    }
};

module.exports = {
    getPropertyStatistics,
    incrementPropertyViews,
    updatePropertyStatistics
};
