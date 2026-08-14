const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireOwnerOrAdmin } = require("../../middlewares/roleMiddleware");
const { uploadRoomImage } = require("../../middlewares/uploadMiddleware");
const {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
} = require("../../controllers/rooms/rooms");

// Room sub-resource controllers
const { getRoomImages, addRoomImage, updateRoomImage, deleteRoomImage } = require("../../controllers/rooms/roomImages");
const { getRoomBeds, addRoomBed, updateRoomBed, deleteRoomBed } = require("../../controllers/rooms/roomBeds");
const { getRoomAmenities, addRoomAmenity, deleteRoomAmenity } = require("../../controllers/rooms/roomAmenities");
const { getRoomFacilities, addRoomFacility, deleteRoomFacility } = require("../../controllers/rooms/roomFacilities");
const { getRoomRates, createRoomRate, updateRoomRate, deleteRoomRate } = require("../../controllers/rooms/roomRates");

// Core Room CRUD
router.get("/", getRooms);
router.get("/:id", getRoomById);
router.post("/", authMiddleware, requireOwnerOrAdmin, createRoom);
router.put("/:id", authMiddleware, requireOwnerOrAdmin, updateRoom);
router.delete("/:id", authMiddleware, requireOwnerOrAdmin, deleteRoom);

// Room Seasonal Rates & Discount Pricing
router.get("/rates/all", getRoomRates);
router.get("/:roomId/rates", getRoomRates);
router.post("/:roomId/rates", authMiddleware, requireOwnerOrAdmin, createRoomRate);
router.put("/:roomId/rates/:rateId", authMiddleware, requireOwnerOrAdmin, updateRoomRate);
router.delete("/:roomId/rates/:rateId", authMiddleware, requireOwnerOrAdmin, deleteRoomRate);

// Room Images
router.get("/:roomId/images", getRoomImages);
router.post("/:roomId/images", authMiddleware, requireOwnerOrAdmin, uploadRoomImage.single("file"), addRoomImage);
router.put("/:roomId/images/:imageId", authMiddleware, requireOwnerOrAdmin, updateRoomImage);
router.delete("/:roomId/images/:imageId", authMiddleware, requireOwnerOrAdmin, deleteRoomImage);

// Room Beds
router.get("/:roomId/beds", getRoomBeds);
router.post("/:roomId/beds", authMiddleware, requireOwnerOrAdmin, addRoomBed);
router.put("/:roomId/beds/:bedId", authMiddleware, requireOwnerOrAdmin, updateRoomBed);
router.delete("/:roomId/beds/:bedId", authMiddleware, requireOwnerOrAdmin, deleteRoomBed);

// Room Amenities
router.get("/:roomId/amenities", getRoomAmenities);
router.post("/:roomId/amenities", authMiddleware, requireOwnerOrAdmin, addRoomAmenity);
router.delete("/:roomId/amenities/:amenityId", authMiddleware, requireOwnerOrAdmin, deleteRoomAmenity);

// Room Facilities
router.get("/:roomId/facilities", getRoomFacilities);
router.post("/:roomId/facilities", authMiddleware, requireOwnerOrAdmin, addRoomFacility);
router.delete("/:roomId/facilities/:facilityId", authMiddleware, requireOwnerOrAdmin, deleteRoomFacility);

module.exports = router;
