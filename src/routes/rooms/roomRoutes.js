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
router.get("/rates/:roomId", getRoomRates);
router.post("/rates/:roomId", authMiddleware, requireOwnerOrAdmin, createRoomRate);
router.put("/rates/:roomId/:rateId", authMiddleware, requireOwnerOrAdmin, updateRoomRate);
router.delete("/rates/:roomId/:rateId", authMiddleware, requireOwnerOrAdmin, deleteRoomRate);

// Room Images
router.get("/images/:roomId", getRoomImages);
router.post("/images/:roomId", authMiddleware, requireOwnerOrAdmin, uploadRoomImage.single("file"), addRoomImage);
router.put("/images/:roomId/:imageId", authMiddleware, requireOwnerOrAdmin, updateRoomImage);
router.delete("/images/:roomId/:imageId", authMiddleware, requireOwnerOrAdmin, deleteRoomImage);

// Room Beds
router.get("/beds/:roomId", getRoomBeds);
router.post("/beds/:roomId", authMiddleware, requireOwnerOrAdmin, addRoomBed);
router.put("/beds/:roomId/:bedId", authMiddleware, requireOwnerOrAdmin, updateRoomBed);
router.delete("/beds/:roomId/:bedId", authMiddleware, requireOwnerOrAdmin, deleteRoomBed);

// Room Amenities
router.get("/amenities/:roomId", getRoomAmenities);
router.post("/amenities/:roomId", authMiddleware, requireOwnerOrAdmin, addRoomAmenity);
router.delete("/amenities/:roomId/:amenityId", authMiddleware, requireOwnerOrAdmin, deleteRoomAmenity);

// Room Facilities
router.get("/facilities/:roomId", getRoomFacilities);
router.post("/facilities/:roomId", authMiddleware, requireOwnerOrAdmin, addRoomFacility);
router.delete("/facilities/:roomId/:facilityId", authMiddleware, requireOwnerOrAdmin, deleteRoomFacility);

module.exports = router;
