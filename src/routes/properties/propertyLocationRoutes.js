const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
    createPropertyLocation,
    deletePropertyLocation,
    getPropertyLocation,
    updatePropertyLocation
} = require("../../controllers/properties/propertyLocations");

const router = express.Router();

router.get("/:propertyId/location", getPropertyLocation);
router.post("/:propertyId/location", authMiddleware, createPropertyLocation);
router.put("/:propertyId/location", authMiddleware, updatePropertyLocation);
router.delete("/:propertyId/location", authMiddleware, deletePropertyLocation);

module.exports = router;
