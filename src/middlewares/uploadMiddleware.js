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

// File filter for images and documents
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif',
        'application/pdf'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP, GIF, AVIF, PDF`);
        error.status = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = {
    upload,
    UPLOADS_ROOT,
    getCategoryDirectory
};
