const db = require("../../config/db");

const getPropertyOwners = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const countQuery = "SELECT COUNT(*) AS total FROM property_owners WHERE delete_status = FALSE";
        const [countResult] = await db.query(countQuery);
        const total = countResult[0]?.total || 0;

        const dataQuery = "SELECT p_owner_id, first_name, last_name, email, phone, created_at FROM property_owners WHERE delete_status = FALSE ORDER BY created_at DESC LIMIT ? OFFSET ?";
        const [rows] = await db.query(dataQuery, [limit, offset]);

        return res.status(200).json({
            success: true,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Admin Dashboard getPropertyOwners Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const approveProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        // Ensure status is valid for approval
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be Approved or Rejected" });
        }

        const adminId = req.user.admin_id;

        const [existing] = await db.query("SELECT property_id, property_status FROM properties WHERE property_id = ? AND delete_status = FALSE", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        await db.query(
            "UPDATE properties SET property_status = ?, is_featured = ?, approval_remarks = ?, approved_by = ?, approved_at = NOW(), updated_by = ? WHERE property_id = ?",
            [status, status === 'Approved' ? true : false, remarks || null, adminId, adminId, id]
        );

        return res.status(200).json({ success: true, message: `Property successfully ${status.toLowerCase()}` });
    } catch (error) {
        console.error("Admin Dashboard approveProperty Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getPropertyOwners,
    approveProperty
};
