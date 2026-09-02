const express = require("express");
const router = express.Router();
const { createEnquiry, getEnquiries, updateEnquiryStatus } = require("../../controllers/enquiries/enquiryController");
const authMiddleware = require("../../middlewares/authMiddleware");

// Public enquiry creation
router.post("/", createEnquiry);

// Management enquiry views & updates
router.get("/", authMiddleware, getEnquiries);
router.put("/:id/status", authMiddleware, updateEnquiryStatus);

module.exports = router;
