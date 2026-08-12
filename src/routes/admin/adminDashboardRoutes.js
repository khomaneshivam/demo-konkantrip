const express = require("express");
const router = express.Router();

const { getPropertyOwners, approveProperty } = require("../../controllers/admin/adminDashboard");
const { getProperties, getPropertyById } = require("../../controllers/properties/properties");

router.get("/owners", getPropertyOwners);

router.get("/owners/:owner_id/properties", (req, res) => {
    req.query.owner_id = req.params.owner_id;
    return getProperties(req, res);
});

router.get("/properties/pending", (req, res) => {
    req.query.status = "Pending";
    return getProperties(req, res);
});

router.get("/properties/:id", getPropertyById);
router.put("/properties/:id/approve", approveProperty);

module.exports = router;
