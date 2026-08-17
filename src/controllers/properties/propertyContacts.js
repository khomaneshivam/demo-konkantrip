const db = require("../../config/db");

const getPropertyContacts = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT pc.*, ct.contact_type_name
             FROM property_contacts pc
             LEFT JOIN contact_types ct ON ct.contact_type_id = pc.contact_type_id
             WHERE pc.property_id = ? AND pc.delete_status = 0
             ORDER BY pc.is_primary DESC, pc.created_at ASC`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching property contacts:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch contacts" });
    }
};

const addPropertyContact = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const {
            contact_type_id,
            contact_name,
            designation,
            mobile_number,
            alternate_number,
            whatsapp_number,
            email,
            website,
            is_primary = false,
            status = true
        } = req.body;

        if (!contact_type_id || !contact_name) {
            return res.status(400).json({ success: false, message: "contact_type_id and contact_name are required" });
        }

        const [result] = await db.query(
            `INSERT INTO property_contacts (
                property_id, contact_type_id, contact_name, designation,
                mobile_number, alternate_number, whatsapp_number, email,
                website, is_primary, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                propertyId, contact_type_id, contact_name, designation || null,
                mobile_number || null, alternate_number || null, whatsapp_number || null,
                email || null, website || null, is_primary, status, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM property_contacts WHERE contact_id = ? AND delete_status = 0", [result.insertId]);
        return res.status(201).json({ success: true, message: "Contact added successfully", data: created[0] });
    } catch (error) {
        console.error("Error adding property contact:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add contact" });
    }
};

const updatePropertyContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const {
            contact_type_id,
            contact_name,
            designation,
            mobile_number,
            alternate_number,
            whatsapp_number,
            email,
            website,
            is_primary,
            status
        } = req.body;

        const [result] = await db.query(
            `UPDATE property_contacts
             SET contact_type_id = COALESCE(?, contact_type_id),
                 contact_name = COALESCE(?, contact_name),
                 designation = COALESCE(?, designation),
                 mobile_number = COALESCE(?, mobile_number),
                 alternate_number = COALESCE(?, alternate_number),
                 whatsapp_number = COALESCE(?, whatsapp_number),
                 email = COALESCE(?, email),
                 website = COALESCE(?, website),
                 is_primary = COALESCE(?, is_primary),
                 status = COALESCE(?, status),
                 updated_by = ?
             WHERE contact_id = ? AND delete_status = 0`,
            [
                contact_type_id, contact_name, designation, mobile_number,
                alternate_number, whatsapp_number, email, website,
                is_primary, status, req.user?.p_owner_id || req.user?.admin_id || null,
                contactId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        const [updated] = await db.query("SELECT * FROM property_contacts WHERE contact_id = ? AND delete_status = 0", [contactId]);
        return res.status(200).json({ success: true, message: "Contact updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating property contact:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update contact" });
    }
};

const deletePropertyContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const [result] = await db.query(
            "UPDATE property_contacts SET delete_status = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE contact_id = ? AND delete_status = 0",
            [req.user?.p_owner_id || req.user?.admin_id || null, contactId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        return res.status(200).json({ success: true, message: "Contact deleted" });
    } catch (error) {
        console.error("Error deleting property contact:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to delete contact" });
    }
};

module.exports = {
    getPropertyContacts,
    addPropertyContact,
    updatePropertyContact,
    deletePropertyContact
};
