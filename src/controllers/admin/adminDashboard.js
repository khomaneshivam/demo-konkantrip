const db = require("../../config/db");

const getGlobalStats = async (req, res) => {
    try {
        const queries = Promise.all([
            db.query("SELECT COUNT(*) AS total FROM properties WHERE delete_status = FALSE"),
            db.query("SELECT COUNT(*) AS total FROM properties WHERE delete_status = FALSE AND property_status = 'Pending'"),
            db.query("SELECT COUNT(*) AS total FROM property_owners WHERE delete_status = FALSE")
        ]);

        const [totalProps, pendingProps, totalHosts] = await queries;

        return res.status(200).json({
            success: true,
            data: {
                totalProperties: totalProps[0][0].total,
                pendingApprovals: pendingProps[0][0].total,
                totalHosts: totalHosts[0][0].total
            }
        });
    } catch (error) {
        console.error("Admin Dashboard getGlobalStats Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getPropertyOwners = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const search = req.query.search ? req.query.search.trim() : "";

        let countQuery = "SELECT COUNT(*) AS total FROM property_owners WHERE delete_status = FALSE";
        let dataQuery = "SELECT p_owner_id, first_name, last_name, email, phone, created_at FROM property_owners WHERE delete_status = FALSE";
        const queryParams = [];

        if (search) {
            const searchClause = " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
            const searchTerm = `%${search}%`;
            countQuery += searchClause;
            dataQuery += searchClause;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        dataQuery += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0]?.total || 0;

        queryParams.push(limit, offset);
        const [rows] = await db.query(dataQuery, queryParams);

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

const getPropertyOwnerById = async (req, res) => {
    try {
        const { owner_id } = req.params;
        const [rows] = await db.query(
            "SELECT p_owner_id, first_name, last_name, email, phone, created_at FROM property_owners WHERE p_owner_id = ? AND delete_status = FALSE LIMIT 1",
            [owner_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Host not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Admin Dashboard getPropertyOwnerById Error:", error);
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

const getPropertyFullDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [properties] = await db.query("SELECT * FROM properties WHERE property_id = ? AND delete_status = FALSE", [id]);
        if (properties.length === 0) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const [locations] = await db.query("SELECT * FROM property_locations WHERE property_id = ?", [id]);
        const [rooms] = await db.query("SELECT * FROM rooms WHERE property_id = ? AND delete_status = FALSE", [id]);
        const [images] = await db.query("SELECT * FROM property_images WHERE property_id = ? AND is_active = 1", [id]);
        const [policies] = await db.query("SELECT * FROM property_policies WHERE property_id = ?", [id]);
        const [contacts] = await db.query("SELECT * FROM property_contacts WHERE property_id = ?", [id]);
        const [amenities] = await db.query("SELECT * FROM property_amenities WHERE property_id = ?", [id]);
        const [documents] = await db.query("SELECT * FROM property_documents WHERE property_id = ? AND delete_status = FALSE", [id]);

        return res.status(200).json({
            success: true,
            data: {
                property: properties[0],
                location: locations.length > 0 ? locations[0] : null,
                rooms: rooms,
                images: images,
                policies: policies.length > 0 ? policies[0] : null,
                contacts: contacts,
                amenities: amenities,
                documents: documents
            }
        });
    } catch (error) {
        console.error("Admin Dashboard getPropertyFullDetails Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getGlobalStats,
    getPropertyOwners,
    getPropertyOwnerById,
    getPropertyFullDetails,
    approveProperty
};
