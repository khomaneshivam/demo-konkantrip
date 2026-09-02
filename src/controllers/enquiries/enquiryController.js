const db = require("../../config/db");
const { resolvePropertyFrontDeskContact, enqueueNotification } = require("../../services/notificationService");
const { isAdmin } = require("../../middlewares/roleMiddleware");

/**
 * POST /api/v1/enquiries
 * Submits a customer inquiry or pre-booking lead for a property
 */
const createEnquiry = async (req, res) => {
    try {
        const {
            property_id,
            room_id = null,
            guest_name,
            guest_mobile,
            guest_email = null,
            check_in_date = null,
            check_out_date = null,
            guests_count = 1,
            message
        } = req.body || {};

        if (!property_id || !guest_name || !guest_mobile || !message) {
            return res.status(400).json({
                success: false,
                message: "Property ID, Guest Name, Mobile Number, and Message are required"
            });
        }

        const [insertResult] = await db.query(
            `INSERT INTO customer_enquiries (
                property_id, room_id, guest_name, guest_mobile, guest_email,
                check_in_date, check_out_date, guests_count, message, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')`,
            [
                property_id, room_id, guest_name, guest_mobile, guest_email,
                check_in_date || null, check_out_date || null, Number(guests_count) || 1, message
            ]
        );

        const enquiryId = insertResult.insertId;

        // Asynchronously notify property front desk about new inquiry
        setImmediate(async () => {
            try {
                const [props] = await db.query("SELECT property_name FROM properties WHERE property_id = ?", [property_id]);
                const propName = props[0]?.property_name || "Property";
                const frontDesk = await resolvePropertyFrontDeskContact(property_id);

                if (frontDesk?.contact_phone) {
                    await enqueueNotification({
                        recipientType: "Property Front Desk",
                        recipientPhone: frontDesk.contact_phone,
                        channel: "WhatsApp",
                        payload: {
                            message: `📩 *NEW GUEST ENQUIRY* for ${propName}!\n\n👤 Name: ${guest_name}\n📱 Mobile: ${guest_mobile}\n💬 Message: "${message}"\n📅 Dates: ${check_in_date || "Flexible"} to ${check_out_date || "Flexible"}\n\nPlease respond to the guest at your earliest convenience.`
                        }
                    });
                }
            } catch (err) {
                console.error("Error dispatching enquiry notification:", err);
            }
        });

        const [created] = await db.query("SELECT * FROM customer_enquiries WHERE enquiry_id = ?", [enquiryId]);

        return res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully. The property team will contact you shortly.",
            data: created[0]
        });
    } catch (error) {
        console.error("Error creating enquiry:", error);
        return res.status(500).json({ success: false, message: "Failed to submit enquiry" });
    }
};

/**
 * GET /api/v1/enquiries
 * Lists enquiries for owner/employee properties
 */
const getEnquiries = async (req, res) => {
    try {
        const { property_id, status, search, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const params = [];
        let whereClauses = ["1=1"];

        // Access Control
        if (req.user?.p_owner_id && !isAdmin(req.user)) {
            whereClauses.push("p.p_owner_id = ?");
            params.push(req.user.p_owner_id);
        } else if (req.user?.employee_id && !isAdmin(req.user)) {
            const assigned = Array.isArray(req.user.assigned_properties) ? req.user.assigned_properties : [];
            if (assigned.length === 0) {
                return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: 1, limit: Number(limit) } });
            }
            whereClauses.push(`p.property_id IN (${assigned.map(() => "?").join(",")})`);
            params.push(...assigned);
        }

        if (property_id) {
            whereClauses.push("e.property_id = ?");
            params.push(property_id);
        }

        if (status) {
            whereClauses.push("e.status = ?");
            params.push(status);
        }

        if (search) {
            whereClauses.push("(e.guest_name LIKE ? OR e.guest_mobile LIKE ? OR e.message LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereSql = whereClauses.join(" AND ");

        const [countRows] = await db.query(
            `SELECT COUNT(*) as total 
             FROM customer_enquiries e 
             INNER JOIN properties p ON p.property_id = e.property_id 
             WHERE ${whereSql}`,
            params
        );
        const total = countRows[0]?.total || 0;

        const [rows] = await db.query(
            `SELECT e.*, p.property_name, r.room_name
             FROM customer_enquiries e
             INNER JOIN properties p ON p.property_id = e.property_id
             LEFT JOIN rooms r ON r.room_id = e.room_id
             WHERE ${whereSql}
             ORDER BY e.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), Number(offset)]
        );

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching enquiries:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch enquiries" });
    }
};

/**
 * PUT /api/v1/enquiries/:id/status
 * Updates enquiry status (New, Responded, Converted, Closed) and internal notes
 */
const updateEnquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body || {};

        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const validStatuses = ["New", "Responded", "Converted", "Closed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const responderId = req.user?.p_owner_id || req.user?.employee_id || req.user?.admin_id || null;

        await db.query(
            `UPDATE customer_enquiries 
             SET status = ?, 
                 notes = COALESCE(?, notes),
                 responded_by = ?,
                 responded_at = CASE WHEN ? = 'Responded' AND responded_at IS NULL THEN NOW() ELSE responded_at END
             WHERE enquiry_id = ?`,
            [status, notes || null, responderId, status, id]
        );

        const [updated] = await db.query("SELECT * FROM customer_enquiries WHERE enquiry_id = ?", [id]);
        if (updated.length === 0) {
            return res.status(404).json({ success: false, message: "Enquiry not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Enquiry status updated successfully",
            data: updated[0]
        });
    } catch (error) {
        console.error("Error updating enquiry status:", error);
        return res.status(500).json({ success: false, message: "Failed to update enquiry status" });
    }
};

module.exports = {
    createEnquiry,
    getEnquiries,
    updateEnquiryStatus
};
