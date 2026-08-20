const express = require("express");
const router = express.Router();

const { getGlobalStats, getPropertyOwners, getPropertyOwnerById, getPropertyFullDetails, approveProperty } = require("../../controllers/admin/adminDashboard");
const { getProperties, getPropertyById } = require("../../controllers/properties/properties");

router.get("/owners", getPropertyOwners);
router.get("/stats", getGlobalStats);

router.get("/owners/:owner_id/properties", (req, res, next) => {
    const clonedReq = Object.assign({}, req, { query: { ...req.query, owner_id: req.params.owner_id } });
    return getProperties(clonedReq, res, next);
});

router.get("/owners/:owner_id", getPropertyOwnerById);

router.get("/properties", getProperties);

router.get("/properties/pending", (req, res, next) => {
    const clonedReq = Object.assign({}, req, { query: { ...req.query, status: "Pending" } });
    return getProperties(clonedReq, res, next);
});

router.get("/properties/fulldetails/:id", getPropertyFullDetails);
router.get("/properties/:id", getPropertyById);
router.put("/properties/:id/approve", approveProperty);

module.exports = router;
