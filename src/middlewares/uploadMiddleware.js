const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

// Ensure upload directories exist
const getCategoryDirectory = (category = 'general') => {
    const safeCategory = ['properties', 'rooms', 'documents', 'profiles', 'general'].includes(category)
        ? category
        : 'general';
    const targetDir = path.join(UPLOADS_ROOT, safeCategory);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    return { targetDir, category: safeCategory };
};

// Disk storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.query.category || req.body.category || 'general';
        const { targetDir } = getCategoryDirectory(category);
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const randomHex = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const safeName = `${timestamp}_${randomHex}${ext}`;
        cb(null, safeName);
    }
});

// File filter for general uploads, images, and documents
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP, GIF, AVIF, PDF, DOC, DOCX, XLS, XLSX, TXT`);
        error.status = 400;
        cb(error, false);
    }
};

// General upload middleware (10MB limit)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Dedicated document upload storage (defaults destination to 'documents')
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { targetDir } = getCategoryDirectory('documents');
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const randomHex = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const safeName = `doc_${timestamp}_${randomHex}${ext}`;
        cb(null, safeName);
    }
});

// Dedicated document upload middleware (20MB limit for PDFs, scans, and licenses)
const uploadDocument = multer({
    storage: documentStorage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    }
});

module.exports = {
    upload,
    uploadDocument,
    UPLOADS_ROOT,
    getCategoryDirectory,
    ALLOWED_MIME_TYPES
};
