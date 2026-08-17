const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireOwnerOrAdmin, requirePropertyOwnership, requireAdmin } = require("../../middlewares/roleMiddleware");
const { uploadDocument, uploadPropertyImage } = require("../../middlewares/uploadMiddleware");

// Controllers
const { getPropertyContacts, addPropertyContact, updatePropertyContact, deletePropertyContact } = require("../../controllers/properties/propertyContacts");
const { getPropertyImages, addPropertyImage, updatePropertyImage, deletePropertyImage } = require("../../controllers/properties/propertyImages");
const { getPropertyAmenities, setPropertyAmenities, deletePropertyAmenity } = require("../../controllers/properties/propertyAmenities");
const { getPropertyHighlights, addPropertyHighlight, updatePropertyHighlight, deletePropertyHighlight } = require("../../controllers/properties/propertyHighlights");
const { getPropertyTags, setPropertyTags, removePropertyTag } = require("../../controllers/properties/propertyTags");
const { getPropertyPolicies, upsertPropertyPolicies } = require("../../controllers/properties/propertyPolicies");
const { getPropertyHouseRules, addPropertyHouseRule, updatePropertyHouseRule, deletePropertyHouseRule } = require("../../controllers/properties/propertyHouseRules");
const { getPropertyNearbyPlaces, addPropertyNearbyPlace, updatePropertyNearbyPlace, deletePropertyNearbyPlace } = require("../../controllers/properties/propertyNearbyPlaces");
const { getPropertyStatistics, incrementPropertyViews, updatePropertyStatistics } = require("../../controllers/properties/propertyStatistics");
const { getPropertyDocuments, uploadPropertyDocument, verifyPropertyDocument, deletePropertyDocument } = require("../../controllers/properties/propertyDocuments");
const { getPropertyLanguages, addPropertyLanguage, deletePropertyLanguage } = require("../../controllers/properties/propertyLanguages");

// Contacts
router.get("/contacts/:propertyId", getPropertyContacts);
router.post("/contacts/:propertyId", authMiddleware, requirePropertyOwnership, addPropertyContact);
router.put("/contacts/:propertyId/:contactId", authMiddleware, requirePropertyOwnership, updatePropertyContact);
router.delete("/contacts/:propertyId/:contactId", authMiddleware, requirePropertyOwnership, deletePropertyContact);

// Images
router.get("/images/:propertyId", getPropertyImages);
router.post("/images/:propertyId", authMiddleware, requirePropertyOwnership, uploadPropertyImage.single("file"), addPropertyImage);
router.put("/images/:propertyId/:imageId", authMiddleware, requirePropertyOwnership, updatePropertyImage);
router.delete("/images/:propertyId/:imageId", authMiddleware, requirePropertyOwnership, deletePropertyImage);

// Amenities
router.get("/amenities/:propertyId", getPropertyAmenities);
router.post("/amenities/:propertyId", authMiddleware, requirePropertyOwnership, setPropertyAmenities);
router.delete("/amenities/:propertyId/:amenityId", authMiddleware, requirePropertyOwnership, deletePropertyAmenity);

// Highlights
router.get("/highlights/:propertyId", getPropertyHighlights);
router.post("/highlights/:propertyId", authMiddleware, requirePropertyOwnership, addPropertyHighlight);
router.put("/highlights/:propertyId/:highlightId", authMiddleware, requirePropertyOwnership, updatePropertyHighlight);
router.delete("/highlights/:propertyId/:highlightId", authMiddleware, requirePropertyOwnership, deletePropertyHighlight);

// Tags
router.get("/tags/:propertyId", getPropertyTags);
router.post("/tags/:propertyId", authMiddleware, requirePropertyOwnership, setPropertyTags);
router.delete("/tags/:propertyId/:tagId", authMiddleware, requirePropertyOwnership, removePropertyTag);

// Policies
router.get("/policies/:propertyId", getPropertyPolicies);
router.post("/policies/:propertyId", authMiddleware, requirePropertyOwnership, upsertPropertyPolicies);
router.put("/policies/:propertyId", authMiddleware, requirePropertyOwnership, upsertPropertyPolicies);

// House Rules
router.get("/house-rules/:propertyId", getPropertyHouseRules);
router.post("/house-rules/:propertyId", authMiddleware, requirePropertyOwnership, addPropertyHouseRule);
router.put("/house-rules/:propertyId/:ruleId", authMiddleware, requirePropertyOwnership, updatePropertyHouseRule);
router.delete("/house-rules/:propertyId/:ruleId", authMiddleware, requirePropertyOwnership, deletePropertyHouseRule);

// Nearby Places
router.get("/nearby-places/:propertyId", getPropertyNearbyPlaces);
router.post("/nearby-places/:propertyId", authMiddleware, requirePropertyOwnership, addPropertyNearbyPlace);
router.put("/nearby-places/:propertyId/:placeId", authMiddleware, requirePropertyOwnership, updatePropertyNearbyPlace);
router.delete("/nearby-places/:propertyId/:placeId", authMiddleware, requirePropertyOwnership, deletePropertyNearbyPlace);

// Statistics
router.get("/statistics/:propertyId", getPropertyStatistics);
router.post("/statistics/view/:propertyId", incrementPropertyViews);
router.put("/statistics/:propertyId", authMiddleware, requirePropertyOwnership, updatePropertyStatistics);

// Documents
router.get("/documents/:propertyId", authMiddleware, requirePropertyOwnership, getPropertyDocuments);
router.post("/documents/:propertyId", authMiddleware, requirePropertyOwnership, uploadDocument.single("file"), uploadPropertyDocument);
router.put("/documents/verify/:propertyId/:documentId", authMiddleware, requireAdmin, verifyPropertyDocument);
router.delete("/documents/:propertyId/:documentId", authMiddleware, requirePropertyOwnership, deletePropertyDocument);

// Languages
router.get("/languages/:propertyId", getPropertyLanguages);
router.post("/languages/:propertyId", authMiddleware, requirePropertyOwnership, addPropertyLanguage);
router.delete("/languages/:propertyId/:id", authMiddleware, requirePropertyOwnership, deletePropertyLanguage);

module.exports = router;
