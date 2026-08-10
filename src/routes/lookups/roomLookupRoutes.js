const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const {
    bedTypesController,
    roomTypesController,
    roomStatusController,
    roomViewsController,
    roomImageTypesController,
    roomFacilityCategoriesController,
    roomFacilitiesController
} = require("../../controllers/lookups/roomLookups");

const mountCrud = (path, controller) => {
    router.get(`/${path}`, controller.getAll);
    router.get(`/${path}/:id`, controller.getById);
    router.post(`/${path}`, authMiddleware, requireAdmin, controller.create);
    router.put(`/${path}/:id`, authMiddleware, requireAdmin, controller.update);
    router.delete(`/${path}/:id`, authMiddleware, requireAdmin, controller.delete);
};

mountCrud("bed-types", bedTypesController);
mountCrud("room-types", roomTypesController);
mountCrud("room-status", roomStatusController);
mountCrud("room-views", roomViewsController);
mountCrud("room-image-types", roomImageTypesController);
mountCrud("facility-categories", roomFacilityCategoriesController);
mountCrud("facilities", roomFacilitiesController);

module.exports = router;
