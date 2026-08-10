const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const {
    languagesController,
    documentTypesController,
    nearbyPlaceTypesController,
    houseRuleCategoriesController,
    tagsController,
    propertyImageTypesController,
    contactTypesController,
    certificationTypesController,
    mealPlansController
} = require("../../controllers/lookups/masterLookups");

const mountCrud = (path, controller) => {
    router.get(`/${path}`, controller.getAll);
    router.get(`/${path}/:id`, controller.getById);
    router.post(`/${path}`, authMiddleware, requireAdmin, controller.create);
    router.put(`/${path}/:id`, authMiddleware, requireAdmin, controller.update);
    router.delete(`/${path}/:id`, authMiddleware, requireAdmin, controller.delete);
};

mountCrud("languages", languagesController);
mountCrud("document-types", documentTypesController);
mountCrud("nearby-place-types", nearbyPlaceTypesController);
mountCrud("house-rule-categories", houseRuleCategoriesController);
mountCrud("tags", tagsController);
mountCrud("property-image-types", propertyImageTypesController);
mountCrud("contact-types", contactTypesController);
mountCrud("certification-types", certificationTypesController);
mountCrud("meal-plans", mealPlansController);

module.exports = router;
