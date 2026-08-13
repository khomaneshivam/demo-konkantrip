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
router.get("/:propertyId/contacts", getPropertyContacts);
router.post("/:propertyId/contacts", authMiddleware, requirePropertyOwnership, addPropertyContact);
router.put("/:propertyId/contacts/:contactId", authMiddleware, requirePropertyOwnership, updatePropertyContact);
router.delete("/:propertyId/contacts/:contactId", authMiddleware, requirePropertyOwnership, deletePropertyContact);

// Images
router.get("/:propertyId/images", getPropertyImages);
router.post("/:propertyId/images", authMiddleware, requirePropertyOwnership, uploadPropertyImage.single("file"), addPropertyImage);
router.put("/:propertyId/images/:imageId", authMiddleware, requirePropertyOwnership, updatePropertyImage);
router.delete("/:propertyId/images/:imageId", authMiddleware, requirePropertyOwnership, deletePropertyImage);

// Amenities
router.get("/:propertyId/amenities", getPropertyAmenities);
router.post("/:propertyId/amenities", authMiddleware, requirePropertyOwnership, setPropertyAmenities);
router.delete("/:propertyId/amenities/:amenityId", authMiddleware, requirePropertyOwnership, deletePropertyAmenity);

// Highlights
router.get("/:propertyId/highlights", getPropertyHighlights);
router.post("/:propertyId/highlights", authMiddleware, requirePropertyOwnership, addPropertyHighlight);
router.put("/:propertyId/highlights/:highlightId", authMiddleware, requirePropertyOwnership, updatePropertyHighlight);
router.delete("/:propertyId/highlights/:highlightId", authMiddleware, requirePropertyOwnership, deletePropertyHighlight);

// Tags
router.get("/:propertyId/tags", getPropertyTags);
router.post("/:propertyId/tags", authMiddleware, requirePropertyOwnership, setPropertyTags);
router.delete("/:propertyId/tags/:tagId", authMiddleware, requirePropertyOwnership, removePropertyTag);

// Policies
router.get("/:propertyId/policies", getPropertyPolicies);
router.post("/:propertyId/policies", authMiddleware, requirePropertyOwnership, upsertPropertyPolicies);
router.put("/:propertyId/policies", authMiddleware, requirePropertyOwnership, upsertPropertyPolicies);

// House Rules
router.get("/:propertyId/house-rules", getPropertyHouseRules);
router.post("/:propertyId/house-rules", authMiddleware, requirePropertyOwnership, addPropertyHouseRule);
router.put("/:propertyId/house-rules/:ruleId", authMiddleware, requirePropertyOwnership, updatePropertyHouseRule);
router.delete("/:propertyId/house-rules/:ruleId", authMiddleware, requirePropertyOwnership, deletePropertyHouseRule);

// Nearby Places
router.get("/:propertyId/nearby-places", getPropertyNearbyPlaces);
router.post("/:propertyId/nearby-places", authMiddleware, requirePropertyOwnership, addPropertyNearbyPlace);
router.put("/:propertyId/nearby-places/:placeId", authMiddleware, requirePropertyOwnership, updatePropertyNearbyPlace);
router.delete("/:propertyId/nearby-places/:placeId", authMiddleware, requirePropertyOwnership, deletePropertyNearbyPlace);

// Statistics
router.get("/:propertyId/statistics", getPropertyStatistics);
router.post("/:propertyId/statistics/view", incrementPropertyViews);
router.put("/:propertyId/statistics", authMiddleware, requirePropertyOwnership, updatePropertyStatistics);

// Documents
router.get("/:propertyId/documents", authMiddleware, requirePropertyOwnership, getPropertyDocuments);
router.post("/:propertyId/documents", authMiddleware, requirePropertyOwnership, uploadDocument.single("file"), uploadPropertyDocument);
router.put("/:propertyId/documents/:documentId/verify", authMiddleware, requireAdmin, verifyPropertyDocument);
router.delete("/:propertyId/documents/:documentId", authMiddleware, requirePropertyOwnership, deletePropertyDocument);

// Languages
router.get("/:propertyId/languages", getPropertyLanguages);
router.post("/:propertyId/languages", authMiddleware, requirePropertyOwnership, addPropertyLanguage);
router.delete("/:propertyId/languages/:id", authMiddleware, requirePropertyOwnership, deletePropertyLanguage);

module.exports = router;
