const db = require("../../config/db");

const getPropertyDocuments = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT pd.*, dt.document_name, dt.document_category, a.first_name as verified_by_name
             FROM property_documents pd
             LEFT JOIN document_types dt ON dt.document_type_id = pd.document_type_id
             LEFT JOIN admin a ON a.admin_id = pd.verified_by
             WHERE pd.property_id = ? AND pd.delete_status = FALSE
             ORDER BY pd.created_at DESC`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching property documents:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch property documents" });
    }
};

const uploadPropertyDocument = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const {
            document_type_id,
            document_number,
            document_title,
            document_description,
            original_file_name,
            stored_file_name,
            file_extension,
            mime_type,
            file_size,
            storage_provider = "AWS_S3",
            storage_bucket,
            storage_path,
            cdn_url,
            thumbnail_url,
            checksum_sha256,
            issue_date,
            expiry_date,
            issued_by,
            issuing_authority,
            remarks
        } = req.body;

        if (!document_type_id || !original_file_name || !stored_file_name) {
            return res.status(400).json({ success: false, message: "document_type_id, original_file_name, and stored_file_name are required" });
        }

        const [result] = await db.query(
            `INSERT INTO property_documents (
                property_id, document_type_id, document_number, document_title,
                document_description, original_file_name, stored_file_name,
                file_extension, mime_type, file_size, storage_provider,
                storage_bucket, storage_path, cdn_url, thumbnail_url,
                checksum_sha256, issue_date, expiry_date, issued_by,
                issuing_authority, verification_status, remarks, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
            [
                propertyId, document_type_id, document_number || null, document_title || null,
                document_description || null, original_file_name, stored_file_name,
                file_extension || null, mime_type || null, file_size || null, storage_provider,
                storage_bucket || null, storage_path || null, cdn_url || null, thumbnail_url || null,
                checksum_sha256 || null, issue_date || null, expiry_date || null, issued_by || null,
                issuing_authority || null, remarks || null, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM property_documents WHERE document_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Document uploaded", data: created[0] });
    } catch (error) {
        console.error("Error uploading property document:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to upload document" });
    }
};

const verifyPropertyDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { verification_status, rejection_reason, verification_notes } = req.body;

        if (!["Verified", "Rejected", "Under Review", "Expired", "Pending"].includes(verification_status)) {
            return res.status(400).json({ success: false, message: "Invalid verification_status" });
        }

        const adminId = req.user?.admin_id;
        if (!adminId) {
            return res.status(403).json({ success: false, message: "Admin verification required" });
        }

        const [result] = await db.query(
            `UPDATE property_documents
             SET verification_status = ?,
                 verified_by = ?,
                 verified_at = NOW(),
                 rejection_reason = ?,
                 verification_notes = ?,
                 updated_by = ?
             WHERE document_id = ? AND delete_status = FALSE`,
            [verification_status, adminId, rejection_reason || null, verification_notes || null, adminId, documentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        const [updated] = await db.query("SELECT * FROM property_documents WHERE document_id = ?", [documentId]);
        return res.status(200).json({ success: true, message: `Document status updated to ${verification_status}`, data: updated[0] });
    } catch (error) {
        console.error("Error verifying property document:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to verify document" });
    }
};

const deletePropertyDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const [result] = await db.query(
            "UPDATE property_documents SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE document_id = ?",
            [req.user?.p_owner_id || req.user?.admin_id || null, documentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        return res.status(200).json({ success: true, message: "Document deleted" });
    } catch (error) {
        console.error("Error deleting property document:", error);
        return res.status(500).json({ success: false, message: "Failed to delete document" });
    }
};

module.exports = {
    getPropertyDocuments,
    uploadPropertyDocument,
    verifyPropertyDocument,
    deletePropertyDocument
};
