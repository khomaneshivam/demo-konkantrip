const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const {
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
} = require("../../controllers/properties/properties");

router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.post("/", authMiddleware, createProperty);
router.put("/:id", authMiddleware, updateProperty);
router.delete("/:id", authMiddleware, deleteProperty);

module.exports = router;
