const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const { requirePropertyOwnership } = require('../../middlewares/roleMiddleware');
const { upload, uploadDocument } = require('../../middlewares/uploadMiddleware');
const uploadController = require('../../controllers/upload/uploadController');

// Global Auth for all upload routes
router.use(authMiddleware);

// Generic file uploads
router.post('/single', upload.single('file'), uploadController.uploadSingleFile);
router.post('/multiple', upload.array('files', 10), uploadController.uploadMultipleFiles);

// Direct property image upload + db record creation
router.post(
    '/property/:propertyId/image',
    requirePropertyOwnership,
    upload.single('file'),
    uploadController.uploadPropertyImageDirect
);

// Direct room image upload + db record creation
router.post(
    '/room/:roomId/image',
    upload.single('file'),
    uploadController.uploadRoomImageDirect
);

// Direct property document upload + db record creation
router.post(
    '/property/:propertyId/document',
    requirePropertyOwnership,
    uploadDocument.single('file'),
    uploadController.uploadPropertyDocumentDirect
);

module.exports = router;
