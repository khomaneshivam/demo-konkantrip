const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireManagementAccess } = require("../../middlewares/roleMiddleware");
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
const { 
    getRoomRates, 
    createRoomRate, 
    updateRoomRate, 
    deleteRoomRate,
    bulkUpdatePricing,
    bulkCreateSeasonalRates 
} = require("../../controllers/rooms/roomRates");

// Core Room CRUD
router.get("/", getRooms);
router.get("/:id", getRoomById);
router.post("/", authMiddleware, requireManagementAccess("rooms:create"), createRoom);
router.put("/:id", authMiddleware, requireManagementAccess("rooms:update"), updateRoom);
router.delete("/:id", authMiddleware, requireManagementAccess("rooms:delete"), deleteRoom);

// Room Seasonal Rates, Bulk Updates & Discount Pricing
router.get("/rates/all", getRoomRates);
router.get("/rates/:roomId", getRoomRates);
router.post("/rates/bulk-update", authMiddleware, requireManagementAccess("rooms:update"), bulkUpdatePricing);
router.post("/rates/bulk-seasonal-rates", authMiddleware, requireManagementAccess("rooms:update"), bulkCreateSeasonalRates);
router.post("/rates/:roomId", authMiddleware, requireManagementAccess("rooms:update"), createRoomRate);
router.put("/rates/:roomId/:rateId", authMiddleware, requireManagementAccess("rooms:update"), updateRoomRate);
router.delete("/rates/:roomId/:rateId", authMiddleware, requireManagementAccess("rooms:update"), deleteRoomRate);

// Room Images
router.get("/images/:roomId", getRoomImages);
router.post(
    "/images/:roomId",
    authMiddleware,
    requireManagementAccess("rooms:update"),
    uploadRoomImage.fields([
        { name: "file", maxCount: 1 },
        { name: "image", maxCount: 1 },
        { name: "photo", maxCount: 1 }
    ]),
    addRoomImage
);
router.put("/images/:roomId/:imageId", authMiddleware, requireManagementAccess("rooms:update"), updateRoomImage);
router.delete("/images/:roomId/:imageId", authMiddleware, requireManagementAccess("rooms:update"), deleteRoomImage);

// Room Beds
router.get("/beds/:roomId", getRoomBeds);
router.post("/beds/:roomId", authMiddleware, requireManagementAccess("rooms:update"), addRoomBed);
router.put("/beds/:roomId/:bedId", authMiddleware, requireManagementAccess("rooms:update"), updateRoomBed);
router.delete("/beds/:roomId/:bedId", authMiddleware, requireManagementAccess("rooms:update"), deleteRoomBed);

// Room Amenities
router.get("/amenities/:roomId", getRoomAmenities);
router.post("/amenities/:roomId", authMiddleware, requireManagementAccess("rooms:update"), addRoomAmenity);
router.delete("/amenities/:roomId/:amenityId", authMiddleware, requireManagementAccess("rooms:update"), deleteRoomAmenity);

// Room Facilities
router.get("/facilities/:roomId", getRoomFacilities);
router.post("/facilities/:roomId", authMiddleware, requireManagementAccess("rooms:update"), addRoomFacility);
router.delete("/facilities/:roomId/:facilityId", authMiddleware, requireManagementAccess("rooms:update"), deleteRoomFacility);

module.exports = router;
