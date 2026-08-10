const db = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const { isAdmin } = require("../../middlewares/requireAdmin");

const LOCATION_FIELDS = new Set([
    "address_line1",
    "address_line2",
    "landmark",
    "village",
    "taluka",
    "district",
    "city",
    "state",
    "country",
    "postal_code",
    "latitude",
    "longitude",
    "google_place_id",
    "google_map_url",
    "plus_code",
    "geohash",
    "timezone"
]);

const normalizeLocationPayload = (payload = {}) => {
    const normalized = {};

    for (const [key, value] of Object.entries(payload)) {
        if (!LOCATION_FIELDS.has(key) || value === undefined || value === null) continue;

        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed) normalized[key] = trimmed;
        } else {
            normalized[key] = value;
        }
    }

    return normalized;
};

const validateLocationPayload = (payload, { requireAddress = false } = {}) => {
    const errors = [];

    if (requireAddress && !payload.address_line1) errors.push("address_line1 is required");
    if (payload.latitude !== undefined && (!Number.isFinite(Number(payload.latitude)) || Number(payload.latitude) < -90 || Number(payload.latitude) > 90)) {
        errors.push("latitude must be between -90 and 90");
    }
    if (payload.longitude !== undefined && (!Number.isFinite(Number(payload.longitude)) || Number(payload.longitude) < -180 || Number(payload.longitude) > 180)) {
        errors.push("longitude must be between -180 and 180");
    }

    return errors;
};

const getActorId = (req = {}) => Number(req.user?.p_owner_id || req.user?.admin_id) || null;

const findManageableProperty = async (req, propertyId) => {
    const [rows] = await db.query(
        "SELECT property_id, p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
        [propertyId]
    );

    if (rows.length === 0) return { property: null, permitted: false };

    const property = rows[0];
    const ownerId = Number(req.user?.p_owner_id);
    return {
        property,
        permitted: isAdmin(req.user) || (Number.isInteger(ownerId) && ownerId === Number(property.p_owner_id))
    };
};

const getPropertyLocation = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT location.* FROM property_locations AS location
             INNER JOIN properties AS property ON property.property_id = location.property_id
             WHERE location.property_id = ? AND location.delete_status = FALSE AND property.delete_status = FALSE
             LIMIT 1`,
            [req.params.propertyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Property location not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to fetch property location" });
    }
};

const createPropertyLocation = async (req, res) => {
    try {
        const propertyId = Number(req.params.propertyId);
        const access = await findManageableProperty(req, propertyId);
        if (!access.property) return res.status(404).json({ success: false, message: "Property not found" });
        if (!access.permitted) return res.status(403).json({ success: false, message: "You cannot manage this property" });

        const payload = normalizeLocationPayload(req.body);
        const errors = validateLocationPayload(payload, { requireAddress: true });
        if (errors.length) return res.status(400).json({ success: false, message: "Validation failed", errors });

        const [existingRows] = await db.query(
            "SELECT location_id FROM property_locations WHERE property_id = ? LIMIT 1",
            [propertyId]
        );
        const actorId = getActorId(req);

        if (existingRows.length > 0) {
            const updateColumns = Object.keys(payload);
            const assignments = [...updateColumns.map((column) => `${column} = ?`), "delete_status = FALSE", "deleted_at = NULL", "deleted_by = NULL", "updated_by = ?"];
            await db.query(
                `UPDATE property_locations SET ${assignments.join(", ")} WHERE property_id = ?`,
                [...updateColumns.map((column) => payload[column]), actorId, propertyId]
            );
        } else {
            const insertPayload = {
                ...payload,
                location_uuid: uuidv4(),
                property_id: propertyId,
                created_by: actorId,
                updated_by: actorId
            };
            const columns = Object.keys(insertPayload);
            await db.query(
                `INSERT INTO property_locations (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
                columns.map((column) => insertPayload[column])
            );
        }

        const [rows] = await db.query(
            "SELECT * FROM property_locations WHERE property_id = ? LIMIT 1",
            [propertyId]
        );
        return res.status(201).json({ success: true, message: "Property location saved successfully", data: rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to save property location" });
    }
};

const updatePropertyLocation = async (req, res) => {
    try {
        const propertyId = Number(req.params.propertyId);
        const access = await findManageableProperty(req, propertyId);
        if (!access.property) return res.status(404).json({ success: false, message: "Property not found" });
        if (!access.permitted) return res.status(403).json({ success: false, message: "You cannot manage this property" });

        const payload = normalizeLocationPayload(req.body);
        const errors = validateLocationPayload(payload);
        if (errors.length) return res.status(400).json({ success: false, message: "Validation failed", errors });
        if (!Object.keys(payload).length) return res.status(400).json({ success: false, message: "No location fields provided" });

        const columns = Object.keys(payload);
        const [result] = await db.query(
            `UPDATE property_locations SET ${columns.map((column) => `${column} = ?`).join(", ")}, updated_by = ?
             WHERE property_id = ? AND delete_status = FALSE`,
            [...columns.map((column) => payload[column]), getActorId(req), propertyId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Property location not found" });

        const [rows] = await db.query("SELECT * FROM property_locations WHERE property_id = ? LIMIT 1", [propertyId]);
        return res.status(200).json({ success: true, message: "Property location updated successfully", data: rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to update property location" });
    }
};

const deletePropertyLocation = async (req, res) => {
    try {
        const propertyId = Number(req.params.propertyId);
        const access = await findManageableProperty(req, propertyId);
        if (!access.property) return res.status(404).json({ success: false, message: "Property not found" });
        if (!access.permitted) return res.status(403).json({ success: false, message: "You cannot manage this property" });

        const [result] = await db.query(
            "UPDATE property_locations SET delete_status = TRUE, deleted_at = NOW(), deleted_by = ? WHERE property_id = ? AND delete_status = FALSE",
            [getActorId(req), propertyId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Property location not found" });

        return res.status(200).json({ success: true, message: "Property location deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to delete property location" });
    }
};

module.exports = {
    createPropertyLocation,
    deletePropertyLocation,
    getPropertyLocation,
    normalizeLocationPayload,
    updatePropertyLocation,
    validateLocationPayload
};
