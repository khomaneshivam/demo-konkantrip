const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const ALL_CATEGORIES = ['properties', 'rooms', 'documents', 'profiles', 'general'];

// Ensure all upload directories exist
const ensureUploadDirectories = () => {
    if (!fs.existsSync(UPLOADS_ROOT)) {
        fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
    }
    ALL_CATEGORIES.forEach((cat) => {
        const catDir = path.join(UPLOADS_ROOT, cat);
        if (!fs.existsSync(catDir)) {
            fs.mkdirSync(catDir, { recursive: true });
        }
    });
};

// Initialize directories immediately
ensureUploadDirectories();

const getCategoryDirectory = (category = 'general') => {
    const safeCategory = ALL_CATEGORIES.includes(category) ? category : 'general';
    const targetDir = path.join(UPLOADS_ROOT, safeCategory);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    return { targetDir, category: safeCategory };
};

// Allowed Document & General Mime Types and Extensions
const DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
];

const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

const IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

// Filter builder requiring both valid mimetype and extension
const createFilter = (allowedMimes, allowedExts, typeLabel) => (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeValid = allowedMimes.includes(file.mimetype);
    const extValid = allowedExts.includes(ext);

    if (mimeValid && extValid) {
        cb(null, true);
    } else {
        const error = new Error(`Unsupported file type (${file.mimetype || 'unknown'} / ${ext || 'none'}). Allowed ${typeLabel}: ${allowedExts.map(e => e.replace('.', '').toUpperCase()).join(', ')}`);
        error.status = 400;
        cb(error, false);
    }
};

const documentFileFilter = createFilter(DOCUMENT_MIME_TYPES, DOCUMENT_EXTENSIONS, 'document formats');
const imageFileFilter = createFilter(IMAGE_MIME_TYPES, IMAGE_EXTENSIONS, 'image formats');

// Helper to create safe filename
const generateSafeFilename = (prefix = 'file', originalname = '') => {
    const ext = path.extname(originalname).toLowerCase();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `${prefix}_${timestamp}_${randomHex}${ext}`;
};

// Category-specific Disk Storage configurations
const createDiskStorage = (category, prefix) => multer.diskStorage({
    destination: (req, file, cb) => {
        const { targetDir } = getCategoryDirectory(category);
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        cb(null, generateSafeFilename(prefix, file.originalname));
    }
});

// Dedicated Document Upload Storage (targets 'uploads/documents')
const documentStorage = createDiskStorage('documents', 'doc');

// Dedicated Property Image Storage (targets 'uploads/properties')
const propertyImageStorage = createDiskStorage('properties', 'prop');

// Dedicated Room Image Storage (targets 'uploads/rooms')
const roomImageStorage = createDiskStorage('rooms', 'room');

// Dedicated Profile Image Storage (targets 'uploads/profiles')
const profileImageStorage = createDiskStorage('profiles', 'user');

// General Storage (dynamic category)
const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.query.category || req.body.category || 'general';
        const { targetDir } = getCategoryDirectory(category);
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        cb(null, generateSafeFilename('file', file.originalname));
    }
});

// Dedicated Document Upload Middleware (25MB limit)
const uploadDocument = multer({
    storage: documentStorage,
    fileFilter: documentFileFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Dedicated Property Image Upload Middleware (15MB limit)
const uploadPropertyImage = multer({
    storage: propertyImageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Dedicated Room Image Upload Middleware (15MB limit)
const uploadRoomImage = multer({
    storage: roomImageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Dedicated Profile Image Upload Middleware (10MB limit)
const uploadProfileImage = multer({
    storage: profileImageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// General Upload Middleware (20MB limit)
const upload = multer({
    storage: generalStorage,
    fileFilter: documentFileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Normalize Storage Provider for MySQL schema ENUM compatibility ('LOCAL', 'AWS_S3', 'AZURE_BLOB', 'GOOGLE_CLOUD')
const normalizeStorageProvider = (provider) => {
    if (!provider) return 'LOCAL';
    const upper = String(provider).trim().toUpperCase();
    if (upper === 'LOCAL' || upper === 'LOCAL_DISK' || upper === 'DISK') return 'LOCAL';
    if (upper === 'AWS_S3' || upper === 'S3') return 'AWS_S3';
    if (upper === 'AZURE_BLOB' || upper === 'AZURE') return 'AZURE_BLOB';
    if (upper === 'GOOGLE_CLOUD' || upper === 'GCP' || upper === 'GCS') return 'GOOGLE_CLOUD';
    return 'LOCAL';
};

// Express error handler for Multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds the allowed limit'
            });
        }
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`
        });
    }
    if (err && err.status === 400) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
};

module.exports = {
    upload,
    uploadDocument,
    uploadPropertyImage,
    uploadRoomImage,
    uploadProfileImage,
    UPLOADS_ROOT,
    ALL_CATEGORIES,
    ensureUploadDirectories,
    getCategoryDirectory,
    normalizeStorageProvider,
    handleMulterError,
    ALLOWED_MIME_TYPES: DOCUMENT_MIME_TYPES,
    DOCUMENT_MIME_TYPES,
    IMAGE_MIME_TYPES
};
