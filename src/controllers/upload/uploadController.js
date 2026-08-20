const path = require('path');
const fs = require('fs').promises;
const db = require('../../config/db');
const { normalizeStorageProvider } = require('../../middlewares/uploadMiddleware');

const cleanupUploadedFile = async (file) => {
    if (file && file.path) {
        try {
            await fs.unlink(file.path);
        } catch (_) {}
    }
};

const buildFilePayload = (req, file, forcedCategory = null) => {
    let category = forcedCategory;
    if (!category && file.destination) {
        const destFolder = path.basename(file.destination);
        if (['properties', 'rooms', 'documents', 'profiles', 'general'].includes(destFolder)) {
            category = destFolder;
        }
    }
    if (!category) {
        category = req.query?.category || req.body?.category || 'general';
    }
    if (!['properties', 'rooms', 'documents', 'profiles', 'general'].includes(category)) {
        category = 'general';
    }

    const defaultPort = process.env.PORT || 3000;
    const host = (typeof req.get === 'function' ? req.get('host') : req.headers?.host) || `localhost:${defaultPort}`;
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const relativePath = `/uploads/${category}/${file.filename}`;
    const fullUrl = `${baseUrl}${relativePath}`;

    return {
        original_name: file.originalname,
        stored_file_name: file.filename,
        file_path: relativePath,
        url: fullUrl,
        cdn_url: fullUrl,
        thumbnail_url: fullUrl,
        category,
        mime_type: file.mimetype,
        file_size: file.size,
        file_extension: path.extname(file.originalname).toLowerCase(),
        storage_provider: 'LOCAL',
        storage_bucket: `uploads/${category}`
    };
};

const uploadSingleFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please provide a file in the form-data with key "file" or "image".'
            });
        }

        const fileData = buildFilePayload(req, req.file);

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: fileData
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        });
    }
};

const uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded. Please provide files in the form-data with key "files" or "images".'
            });
        }

        const filesData = req.files.map((file) => buildFilePayload(req, file));

        return res.status(200).json({
            success: true,
            count: filesData.length,
            message: `${filesData.length} files uploaded successfully`,
            data: filesData
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload files'
        });
    }
};

const uploadDocumentDirect = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No document file uploaded. Form field key should be "file" or "document".'
            });
        }

        const fileData = buildFilePayload(req, req.file, 'documents');

        return res.status(200).json({
            success: true,
            message: 'Document uploaded to local storage successfully',
            data: fileData
        });
    } catch (error) {
        await cleanupUploadedFile(req.file);
        console.error('Error uploading document:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload document'
        });
    }
};

const uploadPropertyImageDirect = async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image file is required' });
        }

        const fileData = buildFilePayload(req, req.file, 'properties');
        const {
            image_type_id = 1,
            image_title,
            image_alt_text,
            is_cover_image = false,
            image_order = 1
        } = req.body;

        if (is_cover_image === 'true' || is_cover_image === true) {
            await db.query('UPDATE property_images SET is_cover_image = FALSE WHERE property_id = ? AND is_active = TRUE', [propertyId]);
        }

        const [result] = await db.query(
            `INSERT INTO property_images (
                property_id, image_type_id, image_title, image_alt_text,
                storage_provider, storage_bucket, storage_key, cdn_url,
                thumbnail_url, mime_type, file_extension, file_size,
                image_order, is_cover_image, is_active, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
            [
                propertyId,
                image_type_id,
                image_title || fileData.original_name,
                image_alt_text || null,
                'LOCAL',
                'uploads/properties',
                fileData.stored_file_name,
                fileData.url,
                fileData.thumbnail_url,
                fileData.mime_type,
                fileData.file_extension,
                fileData.file_size,
                Number(image_order) || 1,
                is_cover_image === 'true' || is_cover_image === true,
                req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [rows] = await db.query('SELECT * FROM property_images WHERE image_id = ? AND is_active = TRUE', [result.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Property image uploaded and saved successfully',
            data: rows[0]
        });
    } catch (error) {
        await cleanupUploadedFile(req.file);
        console.error('Error uploading property image:', error);
        return res.status(500).json({ success: false, message: error.sqlMessage || 'Failed to save property image' });
    }
};

const uploadRoomImageDirect = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Room image file is required' });
        }

        const fileData = buildFilePayload(req, req.file, 'rooms');
        const {
            room_image_type_id = 1,
            image_title,
            image_description,
            is_cover_image = false,
            display_order = 1
        } = req.body;

        if (is_cover_image === 'true' || is_cover_image === true) {
            await db.query('UPDATE room_images SET is_cover_image = FALSE WHERE room_id = ? AND delete_status = FALSE', [roomId]);
        }

        const [result] = await db.query(
            `INSERT INTO room_images (
                room_id, room_image_type_id, image_title, image_description,
                original_file_name, stored_file_name, file_extension, mime_type, file_size,
                storage_provider, storage_bucket, storage_path, cdn_url, thumbnail_url,
                is_cover_image, display_order, is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
            [
                roomId,
                room_image_type_id,
                image_title || fileData.original_name,
                image_description || null,
                fileData.original_name,
                fileData.stored_file_name,
                fileData.file_extension,
                fileData.mime_type,
                fileData.file_size,
                'LOCAL',
                'uploads/rooms',
                fileData.file_path,
                fileData.url,
                fileData.thumbnail_url,
                is_cover_image === 'true' || is_cover_image === true,
                Number(display_order) || 1,
                req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [rows] = await db.query('SELECT * FROM room_images WHERE room_image_id = ? AND delete_status = FALSE', [result.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Room image uploaded and saved successfully',
            data: rows[0]
        });
    } catch (error) {
        await cleanupUploadedFile(req.file);
        console.error('Error uploading room image:', error);
        return res.status(500).json({ success: false, message: error.sqlMessage || 'Failed to save room image' });
    }
};

const uploadPropertyDocumentDirect = async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Document file is required' });
        }

        const fileData = buildFilePayload(req, req.file, 'documents');
        const {
            document_type_id = 1,
            document_number,
            document_title,
            document_description,
            issue_date,
            expiry_date,
            issued_by,
            issuing_authority,
            remarks
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO property_documents (
                property_id, document_type_id, document_number, document_title,
                document_description, original_file_name, stored_file_name,
                file_extension, mime_type, file_size, storage_provider,
                storage_bucket, storage_path, cdn_url, thumbnail_url,
                issue_date, expiry_date, issued_by, issuing_authority,
                verification_status, remarks, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'LOCAL', 'uploads/documents', ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
            [
                propertyId,
                document_type_id,
                document_number || null,
                document_title || fileData.original_name,
                document_description || null,
                fileData.original_name,
                fileData.stored_file_name,
                fileData.file_extension,
                fileData.mime_type,
                fileData.file_size,
                fileData.file_path,
                fileData.url,
                fileData.thumbnail_url,
                issue_date || null,
                expiry_date || null,
                issued_by || null,
                issuing_authority || null,
                remarks || null,
                req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [rows] = await db.query('SELECT * FROM property_documents WHERE document_id = ? AND delete_status = FALSE', [result.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Document uploaded and submitted for verification successfully',
            data: rows[0]
        });
    } catch (error) {
        await cleanupUploadedFile(req.file);
        console.error('Error uploading document:', error);
        return res.status(500).json({ success: false, message: error.sqlMessage || 'Failed to save document' });
    }
};

module.exports = {
    buildFilePayload,
    uploadSingleFile,
    uploadMultipleFiles,
    uploadDocumentDirect,
    uploadPropertyImageDirect,
    uploadRoomImageDirect,
    uploadPropertyDocumentDirect
};
