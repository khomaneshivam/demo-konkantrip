const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const {
    getAmenityCategories,
    createAmenityCategory,
    updateAmenityCategory,
    deleteAmenityCategory,
    getAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity
} = require("../../controllers/lookups/amenities");

// Amenity Categories
router.get("/categories", getAmenityCategories);
router.post("/categories", authMiddleware, requireAdmin, createAmenityCategory);
router.put("/categories/:id", authMiddleware, requireAdmin, updateAmenityCategory);
router.delete("/categories/:id", authMiddleware, requireAdmin, deleteAmenityCategory);

// Amenities
router.get("/", getAmenities);
router.post("/", authMiddleware, requireAdmin, createAmenity);
router.put("/:id", authMiddleware, requireAdmin, updateAmenity);
router.delete("/:id", authMiddleware, requireAdmin, deleteAmenity);

module.exports = router;
