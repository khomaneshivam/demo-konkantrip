const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
    createPropertyLocation,
    deletePropertyLocation,
    getPropertyLocation,
    updatePropertyLocation
} = require("../../controllers/properties/propertyLocations");

const router = express.Router();

router.get("/location/:propertyId", getPropertyLocation);
router.post("/location/:propertyId", authMiddleware, createPropertyLocation);
router.put("/location/:propertyId", authMiddleware, updatePropertyLocation);
router.delete("/location/:propertyId", authMiddleware, deletePropertyLocation);

module.exports = router;
