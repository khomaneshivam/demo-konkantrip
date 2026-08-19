const db = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const { isAdmin, isOwner, isEmployee } = require("../../middlewares/roleMiddleware");
const AuditService = require("../../services/auditService");

const getRooms = async (req, res) => {
    try {
        const {
            property_id,
            room_type_id,
            room_status_id,
            min_guests,
            is_bookable,
            is_published,
            page = 1,
            limit = 20
        } = req.query;

        let query = `
            SELECT r.*, 
                   rt.room_type_name, rt.room_category,
                   rs.status_name as room_status_name, rs.is_bookable as status_bookable,
                   rv.room_view_name,
                   p.property_name, p.p_owner_id
            FROM rooms r
            INNER JOIN properties p ON p.property_id = r.property_id
            LEFT JOIN room_types rt ON rt.room_type_id = r.room_type_id
            LEFT JOIN room_status rs ON rs.room_status_id = r.room_status_id
            LEFT JOIN room_views rv ON rv.room_view_id = r.room_view_id
            WHERE r.delete_status = FALSE AND p.delete_status = FALSE
        `;

        const params = [];

        if (property_id) {
            query += " AND r.property_id = ?";
            params.push(property_id);
        }

        if (room_type_id) {
            query += " AND r.room_type_id = ?";
            params.push(room_type_id);
        }

        if (room_status_id) {
            query += " AND r.room_status_id = ?";
            params.push(room_status_id);
        }

        if (min_guests) {
            query += " AND r.maximum_guests >= ?";
            params.push(min_guests);
        }

        if (is_bookable !== undefined) {
            query += " AND r.is_bookable = ?";
            params.push(is_bookable === "true" || is_bookable === "1" ? 1 : 0);
        }

        if (is_published !== undefined) {
            query += " AND r.is_published = ?";
            params.push(is_published === "true" || is_published === "1" ? 1 : 0);
        }

        query += " ORDER BY r.sort_order ASC, r.created_at DESC";

        const offset = (Math.max(Number(page), 1) - 1) * Number(limit);
        query += " LIMIT ? OFFSET ?";
        params.push(Number(limit), offset);

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch rooms" });
    }
};

const getRoomById = async (req, res) => {
    try {
        const roomId = req.params.id;
        const [rows] = await db.query(
            `SELECT r.*, 
                   rt.room_type_name, rt.room_category,
                   rs.status_name as room_status_name,
                   rv.room_view_name,
                   p.property_name, p.p_owner_id
            FROM rooms r
            INNER JOIN properties p ON p.property_id = r.property_id
            LEFT JOIN room_types rt ON rt.room_type_id = r.room_type_id
            LEFT JOIN room_status rs ON rs.room_status_id = r.room_status_id
            LEFT JOIN room_views rv ON rv.room_view_id = r.room_view_id
            WHERE r.room_id = ? AND r.delete_status = FALSE LIMIT 1`,
            [roomId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        const room = rows[0];

        // Fetch beds
        const [beds] = await db.query(
            `SELECT rb.*, bt.bed_type_name, bt.bed_size
             FROM room_beds rb
             INNER JOIN bed_types bt ON bt.bed_type_id = rb.bed_type_id
             WHERE rb.room_id = ? AND rb.delete_status = FALSE`,
            [roomId]
        );

        // Fetch images
        const [images] = await db.query(
            `SELECT ri.*, rit.image_type_name
             FROM room_images ri
             LEFT JOIN room_image_types rit ON rit.room_image_type_id = ri.room_image_type_id
             WHERE ri.room_id = ? AND ri.delete_status = FALSE
             ORDER BY ri.is_cover_image DESC, ri.display_order ASC`,
            [roomId]
        );

        // Fetch amenities
        const [amenities] = await db.query(
            `SELECT ra.*, a.amenity_name, a.amenity_icon
             FROM room_amenities ra
             INNER JOIN amenities a ON a.amenity_id = ra.amenity_id
             WHERE ra.room_id = ? AND ra.delete_status = FALSE`,
            [roomId]
        );

        // Fetch facilities
        const [facilities] = await db.query(
            `SELECT rfm.*, rf.facility_name, rf.facility_icon, rfc.category_name as facility_category_name
             FROM room_facilities_mapping rfm
             INNER JOIN room_facilities rf ON rf.room_facility_id = rfm.room_facility_id
             LEFT JOIN room_facility_categories rfc ON rfc.room_facility_category_id = rf.room_facility_category_id
             WHERE rfm.room_id = ? AND rfm.delete_status = FALSE`,
            [roomId]
        );

        // Fetch seasonal rates
        const [seasonal_rates] = await db.query(
            `SELECT * FROM room_seasonal_rates
             WHERE room_id = ? AND delete_status = FALSE AND is_active = TRUE
             ORDER BY start_date ASC`,
            [roomId]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...room,
                beds,
                images,
                amenities,
                facilities,
                seasonal_rates
            }
        });
    } catch (error) {
        console.error("Error fetching room details:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch room details" });
    }
};

const syncPropertyStartingPrice = async (propertyId) => {
    try {
        const [rows] = await db.query(
            `SELECT MIN(COALESCE(NULLIF(discount_price, 0), NULLIF(base_price, 0))) as min_price 
             FROM rooms 
             WHERE property_id = ? AND delete_status = FALSE AND (base_price > 0 OR discount_price > 0)`,
            [propertyId]
        );
        if (rows.length > 0 && rows[0].min_price !== null) {
            await db.query("UPDATE properties SET starting_price = ? WHERE property_id = ?", [rows[0].min_price, propertyId]);
        }
    } catch (err) {
        console.warn("Could not sync starting_price for property:", err.message);
    }
};

const ROOM_COLUMNS = new Set([
    "property_id",
    "room_type_id",
    "room_status_id",
    "room_view_id",
    "room_name",
    "room_code",
    "room_slug",
    "room_number",
    "internal_reference",
    "description",
    "short_description",
    "room_area",
    "room_area_unit",
    "floor_number",
    "maximum_adults",
    "maximum_children",
    "maximum_guests",
    "base_occupancy",
    "minimum_occupancy",
    "bathrooms",
    "balconies",
    "bedrooms",
    "living_rooms",
    "kitchens",
    "smoking_allowed",
    "pets_allowed",
    "extra_bed_allowed",
    "extra_bed_count",
    "extra_bed_price",
    "breakfast_included",
    "air_conditioned",
    "soundproof",
    "wheelchair_accessible",
    "housekeeping_available",
    "housekeeping_frequency",
    "room_size_category",
    "room_condition",
    "sort_order",
    "is_featured",
    "is_published",
    "is_bookable",
    "is_active",
    "remarks",
    "base_price",
    "discount_price",
    "extra_adult_price",
    "extra_child_price"
]);

const createRoom = async (req, res) => {
    try {
        const body = { ...req.body };

        // Map price to base_price if price was sent
        if (body.price !== undefined && body.base_price === undefined) {
            body.base_price = body.price;
        }
        delete body.price;

        const {
            property_id,
            room_type_id,
            room_status_id,
            room_name,
            room_code
        } = body;

        if (!property_id || !room_type_id || !room_status_id || !room_name || !room_code) {
            return res.status(400).json({
                success: false,
                message: "property_id, room_type_id, room_status_id, room_name, and room_code are required"
            });
        }

        // Verify property ownership or employee assignment
        if (!isAdmin(req.user)) {
            const propId = Number(property_id);
            if (isOwner(req.user)) {
                const [prop] = await db.query(
                    "SELECT p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
                    [propId]
                );
                if (prop.length === 0 || Number(prop[0].p_owner_id) !== Number(req.user?.p_owner_id)) {
                    return res.status(403).json({ success: false, message: "You cannot add rooms to this property" });
                }
            } else if (isEmployee(req.user)) {
                const employeeId = Number(req.user.employee_id);
                const assignedList = Array.isArray(req.user.assigned_properties) ? req.user.assigned_properties.map(Number) : [];
                if (!assignedList.includes(propId)) {
                    const [mapping] = await db.query(
                        "SELECT mapping_id FROM property_employees WHERE property_id = ? AND employee_id = ? AND status = 'Active' AND delete_status = FALSE LIMIT 1",
                        [propId, employeeId]
                    );
                    if (mapping.length === 0) {
                        return res.status(403).json({ success: false, message: "You are not assigned to manage rooms for this property" });
                    }
                }
            } else {
                return res.status(403).json({ success: false, message: "Unauthorized to add rooms" });
            }
        }

        const roomUuid = uuidv4();
        const roomSlug = body.room_slug || `${room_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

        delete body.room_id;
        delete body.room_uuid;
        delete body.created_at;
        delete body.updated_at;
        delete body.delete_status;

        const payload = {
            room_uuid: roomUuid,
            room_slug: roomSlug,
            created_by: req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null
        };

        for (const [key, value] of Object.entries(body)) {
            if (ROOM_COLUMNS.has(key) && value !== undefined) {
                payload[key] = value;
            }
        }

        const fields = Object.keys(payload);
        const values = Object.values(payload);
        const placeholders = fields.map(() => "?").join(", ");

        const [result] = await db.query(`INSERT INTO rooms (${fields.join(", ")}) VALUES (${placeholders})`, values);

        // Update total_rooms count on property & sync starting_price
        await db.query("UPDATE properties SET total_rooms = total_rooms + 1 WHERE property_id = ? AND delete_status = FALSE", [property_id]);
        await syncPropertyStartingPrice(property_id);

        const [created] = await db.query("SELECT * FROM rooms WHERE room_id = ? AND delete_status = FALSE LIMIT 1", [result.insertId]);

        // Record Audit Trail
        await AuditService.logAudit({
            req,
            property_id,
            module: "Rooms",
            action: "CREATE",
            record_id: result.insertId,
            record_name: room_name,
            new_values: created[0],
            description: `Created room "${room_name}" (${room_code}) with base price ₹${payload.base_price || 0}`
        });

        return res.status(201).json({ success: true, message: "Room created successfully", data: created[0] });
    } catch (error) {
        console.error("Error creating room:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create room" });
    }
};

const updateRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const body = { ...req.body };

        // Map price to base_price if price was sent
        if (body.price !== undefined && body.base_price === undefined) {
            body.base_price = body.price;
        }
        delete body.price;
        delete body.room_id;
        delete body.room_uuid;
        delete body.property_id; // prevent moving rooms across properties
        delete body.created_at;
        delete body.updated_at;
        delete body.delete_status;
        delete body.created_by;

        const [oldRoomRows] = await db.query("SELECT * FROM rooms WHERE room_id = ? AND delete_status = FALSE LIMIT 1", [roomId]);
        if (oldRoomRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        const oldRoom = oldRoomRows[0];
        const propertyId = Number(oldRoom.property_id);

        // Verify property ownership or employee assignment
        if (!isAdmin(req.user)) {
            if (isOwner(req.user)) {
                const [prop] = await db.query(
                    "SELECT p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
                    [propertyId]
                );
                if (prop.length === 0 || Number(prop[0].p_owner_id) !== Number(req.user?.p_owner_id)) {
                    return res.status(403).json({ success: false, message: "You cannot update rooms for this property" });
                }
            } else if (isEmployee(req.user)) {
                const employeeId = Number(req.user.employee_id);
                const assignedList = Array.isArray(req.user.assigned_properties) ? req.user.assigned_properties.map(Number) : [];
                if (!assignedList.includes(propertyId)) {
                    const [mapping] = await db.query(
                        "SELECT mapping_id FROM property_employees WHERE property_id = ? AND employee_id = ? AND status = 'Active' AND delete_status = FALSE LIMIT 1",
                        [propertyId, employeeId]
                    );
                    if (mapping.length === 0) {
                        return res.status(403).json({ success: false, message: "You are not assigned to manage rooms for this property" });
                    }
                }
            } else {
                return res.status(403).json({ success: false, message: "Unauthorized to update rooms" });
            }
        }

        const updatePayload = {};
        for (const [key, value] of Object.entries(body)) {
            if (ROOM_COLUMNS.has(key) && key !== "property_id" && value !== undefined) {
                updatePayload[key] = value;
            }
        }

        const fields = Object.keys(updatePayload);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const setClauses = fields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?";
        const currentUserId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;
        const values = [...Object.values(updatePayload), currentUserId, roomId];

        const [result] = await db.query(`UPDATE rooms SET ${setClauses} WHERE room_id = ? AND delete_status = FALSE`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        const [updated] = await db.query("SELECT * FROM rooms WHERE room_id = ? AND delete_status = FALSE LIMIT 1", [roomId]);
        if (updated.length > 0) {
            await syncPropertyStartingPrice(updated[0].property_id);

            // Record Audit Trail
            await AuditService.logAudit({
                req,
                property_id: updated[0].property_id,
                module: "Rooms",
                action: "UPDATE",
                record_id: roomId,
                record_name: updated[0].room_name,
                old_values: oldRoom,
                new_values: updated[0]
            });
        }

        return res.status(200).json({ success: true, message: "Room updated successfully", data: updated[0] });
    } catch (error) {
        console.error("Error updating room:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update room" });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const [roomRows] = await db.query("SELECT * FROM rooms WHERE room_id = ? AND delete_status = FALSE LIMIT 1", [roomId]);
        if (roomRows.length === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        const propertyId = Number(roomRows[0].property_id);

        // Verify property ownership or employee assignment
        if (!isAdmin(req.user)) {
            if (isOwner(req.user)) {
                const [prop] = await db.query(
                    "SELECT p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
                    [propertyId]
                );
                if (prop.length === 0 || Number(prop[0].p_owner_id) !== Number(req.user?.p_owner_id)) {
                    return res.status(403).json({ success: false, message: "You cannot delete rooms for this property" });
                }
            } else if (isEmployee(req.user)) {
                const employeeId = Number(req.user.employee_id);
                const assignedList = Array.isArray(req.user.assigned_properties) ? req.user.assigned_properties.map(Number) : [];
                if (!assignedList.includes(propertyId)) {
                    const [mapping] = await db.query(
                        "SELECT mapping_id FROM property_employees WHERE property_id = ? AND employee_id = ? AND status = 'Active' AND delete_status = FALSE LIMIT 1",
                        [propertyId, employeeId]
                    );
                    if (mapping.length === 0) {
                        return res.status(403).json({ success: false, message: "You are not assigned to manage rooms for this property" });
                    }
                }
            } else {
                return res.status(403).json({ success: false, message: "Unauthorized to delete rooms" });
            }
        }

        const currentUserId = req.user?.employee_id || req.user?.p_owner_id || req.user?.admin_id || null;
        const [result] = await db.query(
            "UPDATE rooms SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE room_id = ? AND delete_status = FALSE",
            [currentUserId, roomId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        // Decrement total_rooms on property & sync starting price
        await db.query("UPDATE properties SET total_rooms = GREATEST(0, total_rooms - 1) WHERE property_id = ? AND delete_status = FALSE", [roomRows[0].property_id]);
        await syncPropertyStartingPrice(roomRows[0].property_id);

        // Record Audit Trail
        await AuditService.logAudit({
            req,
            property_id: roomRows[0].property_id,
            module: "Rooms",
            action: "DELETE",
            record_id: roomId,
            record_name: roomRows[0].room_name,
            old_values: roomRows[0],
            description: `Soft deleted room "${roomRows[0].room_name}" (#${roomId})`
        });

        return res.status(200).json({ success: true, message: "Room deleted successfully" });
    } catch (error) {
        console.error("Error deleting room:", error);
        return res.status(500).json({ success: false, message: "Failed to delete room" });
    }
};

module.exports = {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
};
