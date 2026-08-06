const db = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const { isAdmin } = require("../../middleware/requireAdmin");

const VALID_PROPERTY_TYPES = [
    "Hotel",
    "Resort",
    "Homestay",
    "Villa",
    "Apartment",
    "Guest House",
    "Hostel",
    "Cottage",
    "Farm Stay",
    "Beach House",
    "Bungalow",
    "Tent",
    "Camping",
    "Houseboat"
];

const VALID_PROPERTY_CATEGORIES = [
    "Budget",
    "Economy",
    "Standard",
    "Premium",
    "Luxury",
    "Boutique"
];

const VALID_PROPERTY_STATUSES = [
    "Draft",
    "Pending",
    "Under Review",
    "Approved",
    "Rejected",
    "Suspended",
    "Inactive"
];

const VALID_PRICE_DISPLAY_TYPES = [
    "Per Night",
    "Per Person",
    "Entire Property"
];

const ADMIN_ONLY_PROPERTY_FIELDS = new Set([
    "is_verified",
    "is_featured",
    "property_status",
    "approval_remarks",
    "approved_by",
    "approved_at"
]);

const PROPERTY_WRITE_FIELDS = new Set([
    "property_name",
    "property_slug",
    "property_type",
    "property_category",
    "property_description",
    "short_description",
    "star_rating",
    "check_in_time",
    "check_out_time",
    "total_rooms",
    "total_floors",
    "built_year",
    "renovated_year",
    "currency_code",
    "price_display_type",
    "instant_booking",
    ...ADMIN_ONLY_PROPERTY_FIELDS
]);

const DEFAULT_PROPERTY_VALUES = {
    property_category: "Standard",
    check_in_time: "12:00:00",
    check_out_time: "10:00:00",
    currency_code: "INR",
    price_display_type: "Per Night",
    instant_booking: true,
    property_status: "Draft",
    delete_status: false,
    average_rating: 0.0,
    total_reviews: 0,
    total_bookings: 0,
    total_views: 0,
    is_verified: false,
    is_featured: false,
    star_rating: 0,
    total_rooms: 0,
    total_floors: 0
};

const PROPERTY_COLUMNS = [
    "property_uuid",
    "p_owner_id",
    "property_name",
    "property_slug",
    "property_type",
    "property_category",
    "property_description",
    "short_description",
    "star_rating",
    "check_in_time",
    "check_out_time",
    "total_rooms",
    "total_floors",
    "built_year",
    "renovated_year",
    "currency_code",
    "price_display_type",
    "average_rating",
    "total_reviews",
    "total_bookings",
    "total_views",
    "is_verified",
    "is_featured",
    "instant_booking",
    "property_status",
    "approval_remarks",
    "approved_by",
    "approved_at",
    "created_by",
    "updated_by",
    "delete_status"
];

const buildPropertySlug = async (value) => {
    const base = (value || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    return base || "property";
};

const resolvePropertyOwnerId = (req, fallback = null) => {
    const authOwnerId = req?.user?.p_owner_id;
    if (authOwnerId !== undefined && authOwnerId !== null && authOwnerId !== "") {
        return Number(authOwnerId);
    }

    if (fallback !== null && fallback !== undefined && fallback !== "") {
        return Number(fallback);
    }

    return null;
};

const isSuperAdmin = (req = {}) => {
    const user = req.user || {};
    const role = String(user.role || user.user_type || user.type || "").toLowerCase();

    return Boolean(
        user.is_super_admin === true ||
        user.super_admin === true ||
        user.isAdmin === true ||
        role === "super_admin" ||
        role === "superadmin"
    );
};

const sanitizePropertyPayloadForRole = (payload = {}, req = {}) => {
    const sanitized = { ...(payload || {}) };

    if (!isSuperAdmin(req)) {
        for (const field of ADMIN_ONLY_PROPERTY_FIELDS) {
            delete sanitized[field];
        }
    }

    if (sanitized.property_status === "Approved" && isSuperAdmin(req)) {
        sanitized.is_featured = true;
    }

    return sanitized;
};

const normalizePropertyPayload = async (payload = {}) => {
    const normalized = {};

    for (const [key, value] of Object.entries(payload || {})) {
        if (!PROPERTY_WRITE_FIELDS.has(key)) {
            continue;
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed === "") {
                continue;
            }
            normalized[key] = trimmed;
            continue;
        }

        if (value !== undefined && value !== null) {
            normalized[key] = value;
        }
    }

    return normalized;
};

const validatePropertyPayload = (payload) => {
    const errors = [];

    if (payload.property_name !== undefined && typeof payload.property_name !== "string") {
        errors.push("property_name must be a string");
    }

    if (payload.property_type && !VALID_PROPERTY_TYPES.includes(payload.property_type)) {
        errors.push("property_type is invalid");
    }

    if (payload.property_category && !VALID_PROPERTY_CATEGORIES.includes(payload.property_category)) {
        errors.push("property_category is invalid");
    }

    if (payload.property_status && !VALID_PROPERTY_STATUSES.includes(payload.property_status)) {
        errors.push("property_status is invalid");
    }

    if (payload.price_display_type && !VALID_PRICE_DISPLAY_TYPES.includes(payload.price_display_type)) {
        errors.push("price_display_type is invalid");
    }

    if (payload.star_rating !== undefined && (Number.isNaN(Number(payload.star_rating)) || Number(payload.star_rating) < 0 || Number(payload.star_rating) > 5)) {
        errors.push("star_rating must be between 0 and 5");
    }

    if (payload.total_rooms !== undefined && (Number.isNaN(Number(payload.total_rooms)) || Number(payload.total_rooms) < 0)) {
        errors.push("total_rooms must be zero or greater");
    }

    if (payload.total_floors !== undefined && (Number.isNaN(Number(payload.total_floors)) || Number(payload.total_floors) < 0)) {
        errors.push("total_floors must be zero or greater");
    }

    for (const field of ["built_year", "renovated_year"]) {
        if (payload[field] !== undefined && (!Number.isInteger(Number(payload[field])) || Number(payload[field]) < 1000 || Number(payload[field]) > 9999)) {
            errors.push(`${field} must be a four-digit year`);
        }
    }

    return errors;
};

const ensureUniquePropertySlug = async (slug, excludeId = null) => {
    let candidate = slug;
    let counter = 2;

    while (true) {
        const [rows] = await db.query(
            excludeId
                ? "SELECT property_id FROM properties WHERE property_slug = ? AND property_id != ? LIMIT 1"
                : "SELECT property_id FROM properties WHERE property_slug = ? LIMIT 1",
            excludeId ? [candidate, excludeId] : [candidate]
        );

        if (rows.length === 0) {
            return candidate;
        }

        candidate = `${slug}-${counter}`;
        counter += 1;
    }
};

const ensureOwnerExists = async (pOwnerId) => {
    const [rows] = await db.query(
        "SELECT p_owner_id FROM property_owners WHERE p_owner_id = ? AND delete_status = FALSE LIMIT 1",
        [pOwnerId]
    );

    return rows.length > 0;
};

const canManageProperty = (req, property) => {
    if (isAdmin(req.user)) return true;
    return Number(req.user?.p_owner_id) === Number(property.p_owner_id);
};

const getProperties = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const search = (req.query.search || "").trim();
        const ownerId = req.query.owner_id ? Number(req.query.owner_id) : null;
        const status = req.query.status ? req.query.status.trim() : null;
        const featured = req.query.featured === "true";
        const verified = req.query.verified === "true";
        const conditions = [];
        const values = [];

        conditions.push("delete_status = FALSE");

        if (ownerId) {
            conditions.push("p_owner_id = ?");
            values.push(ownerId);
        }

        if (status) {
            conditions.push("property_status = ?");
            values.push(status);
        }

        if (featured) {
            conditions.push("is_featured = TRUE");
        }

        if (verified) {
            conditions.push("is_verified = TRUE");
        }

        if (search) {
            conditions.push("(property_name LIKE ? OR property_slug LIKE ? OR property_description LIKE ?)");
            const searchTerm = `%${search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const countQuery = `SELECT COUNT(*) AS total FROM properties ${whereClause}`;
        const [countResult] = await db.query(countQuery, values);
        const total = countResult[0]?.total || 0;

        const dataQuery = `SELECT * FROM properties ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        const [rows] = await db.query(dataQuery, [...values, limit, offset]);

        return res.status(200).json({
            success: true,
            count: rows.length,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            data: rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch properties"
        });
    }
};

const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch property"
        });
    }
};

const createProperty = async (req, res) => {
    try {
        const payload = await normalizePropertyPayload(req.body || {});
        const sanitizedPayload = sanitizePropertyPayloadForRole(payload, req);
        const validationErrors = validatePropertyPayload(sanitizedPayload);
        const authenticatedOwnerId = resolvePropertyOwnerId(req);

        if (!sanitizedPayload.property_name || !sanitizedPayload.property_type) {
            validationErrors.push("property_name and property_type are required");
        }

        if (!authenticatedOwnerId) {
            validationErrors.push("Authenticated owner is required");
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        const ownerExists = await ensureOwnerExists(authenticatedOwnerId);
        if (!ownerExists) {
            return res.status(404).json({
                success: false,
                message: "Property owner not found"
            });
        }

        const baseSlug = sanitizedPayload.property_slug || (await buildPropertySlug(sanitizedPayload.property_name));
        const propertySlug = await ensureUniquePropertySlug(baseSlug);

        const insertPayload = {
            ...DEFAULT_PROPERTY_VALUES,
            ...sanitizedPayload,
            property_uuid: sanitizedPayload.property_uuid || uuidv4(),
            p_owner_id: authenticatedOwnerId,
            property_name: sanitizedPayload.property_name.trim(),
            property_slug: propertySlug,
            property_status: sanitizedPayload.property_status || DEFAULT_PROPERTY_VALUES.property_status,
            created_by: authenticatedOwnerId,
            updated_by: authenticatedOwnerId
        };

        const insertColumns = PROPERTY_COLUMNS.filter((column) => column in insertPayload);
        const placeholders = insertColumns.map(() => "?").join(", ");
        const values = insertColumns.map((column) => insertPayload[column]);

        const [result] = await db.query(
            `INSERT INTO properties (${insertColumns.join(", ")}) VALUES (${placeholders})`,
            values
        );

        const [rows] = await db.query(
            "SELECT * FROM properties WHERE property_id = ? LIMIT 1",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Property created successfully",
            data: rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create property"
        });
    }
};

const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedOwnerId = resolvePropertyOwnerId(req);
        const [existingRows] = await db.query(
            "SELECT * FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const existingProperty = existingRows[0];
        if (!canManageProperty(req, existingProperty)) {
            return res.status(403).json({
                success: false,
                message: "You cannot manage this property"
            });
        }
        const payload = await normalizePropertyPayload(req.body || {});
        const sanitizedPayload = sanitizePropertyPayloadForRole(payload, req);
        const validationErrors = validatePropertyPayload(sanitizedPayload);

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        if (Object.keys(sanitizedPayload).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No update fields provided"
            });
        }

        const updatePayload = { ...sanitizedPayload };
        if (updatePayload.property_name && typeof updatePayload.property_name === "string") {
            updatePayload.property_name = updatePayload.property_name.trim();
        }

        updatePayload.updated_by = authenticatedOwnerId || req.user?.admin_id || existingProperty.updated_by;

        if (updatePayload.property_name && !updatePayload.property_slug && updatePayload.property_name !== existingProperty.property_name) {
            updatePayload.property_slug = await ensureUniquePropertySlug(await buildPropertySlug(updatePayload.property_name), existingProperty.property_id);
        }

        if (updatePayload.property_slug) {
            updatePayload.property_slug = await ensureUniquePropertySlug(updatePayload.property_slug, existingProperty.property_id);
        }

        const updateColumns = Object.keys(updatePayload);
        const values = updateColumns.map((column) => updatePayload[column]);
        const assignments = updateColumns.map((column) => `${column} = ?`).join(", ");

        await db.query(
            `UPDATE properties SET ${assignments} WHERE property_id = ?`,
            [...values, id]
        );

        const [updatedRows] = await db.query(
            "SELECT * FROM properties WHERE property_id = ? LIMIT 1",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Property updated successfully",
            data: updatedRows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update property"
        });
    }
};

const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedOwnerId = resolvePropertyOwnerId(req);
        const [rows] = await db.query(
            "SELECT * FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        if (!canManageProperty(req, rows[0])) {
            return res.status(403).json({
                success: false,
                message: "You cannot manage this property"
            });
        }

        await db.query(
            "UPDATE properties SET delete_status = TRUE, deleted_at = NOW(), property_status = 'Inactive', updated_by = ? WHERE property_id = ?",
            [authenticatedOwnerId || req.user?.admin_id || rows[0].created_by || rows[0].p_owner_id, id]
        );

        return res.status(200).json({
            success: true,
            message: "Property deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete property"
        });
    }
};

module.exports = {
    buildPropertySlug,
    normalizePropertyPayload,
    resolvePropertyOwnerId,
    sanitizePropertyPayloadForRole,
    isSuperAdmin,
    canManageProperty,
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
};
