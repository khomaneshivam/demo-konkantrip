const db = require("../../config/db");

const getPropertyHighlights = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            "SELECT * FROM property_highlights WHERE property_id = ? AND status = TRUE ORDER BY display_order ASC, created_at ASC",
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching property highlights:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch highlights" });
    }
};

const addPropertyHighlight = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const { highlight_title, highlight_description, highlight_icon, display_order = 1, status = true } = req.body;

        if (!highlight_title) {
            return res.status(400).json({ success: false, message: "highlight_title is required" });
        }

        const [result] = await db.query(
            `INSERT INTO property_highlights (property_id, highlight_title, highlight_description, highlight_icon, display_order, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [propertyId, highlight_title, highlight_description || null, highlight_icon || null, display_order, status]
        );

        const [created] = await db.query("SELECT * FROM property_highlights WHERE highlight_id = ? AND status = TRUE", [result.insertId]);
        return res.status(201).json({ success: true, message: "Highlight added successfully", data: created[0] });
    } catch (error) {
        console.error("Error adding property highlight:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add highlight" });
    }
};

const updatePropertyHighlight = async (req, res) => {
    try {
        const { highlightId } = req.params;
        const { highlight_title, highlight_description, highlight_icon, display_order, status } = req.body;

        const [result] = await db.query(
            `UPDATE property_highlights
             SET highlight_title = COALESCE(?, highlight_title),
                 highlight_description = COALESCE(?, highlight_description),
                 highlight_icon = COALESCE(?, highlight_icon),
                 display_order = COALESCE(?, display_order),
                 status = COALESCE(?, status)
             WHERE highlight_id = ? AND status = TRUE`,
            [highlight_title, highlight_description, highlight_icon, display_order, status, highlightId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Highlight not found" });
        }

        const [updated] = await db.query("SELECT * FROM property_highlights WHERE highlight_id = ? AND status = TRUE", [highlightId]);
        return res.status(200).json({ success: true, message: "Highlight updated", data: updated[0] });
    } catch (error) {
        console.log("Error updating highlight:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update highlight" });
    }
};

const deletePropertyHighlight = async (req, res) => {
    try {
        const { highlightId } = req.params;
        const [result] = await db.query("UPDATE property_highlights SET status = FALSE WHERE highlight_id = ? AND status = TRUE", [highlightId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Highlight not found" });
        }
        return res.status(200).json({ success: true, message: "Highlight deleted" });
    } catch (error) {
        console.error("Error deleting highlight:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to delete highlight" });
    }
};

module.exports = {
    getPropertyHighlights,
    addPropertyHighlight,
    updatePropertyHighlight,
    deletePropertyHighlight
};
