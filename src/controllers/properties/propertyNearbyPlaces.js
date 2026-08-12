const db = require("../../config/db");

const getPropertyNearbyPlaces = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const [rows] = await db.query(
            `SELECT pnp.*, npt.place_type_name, npt.place_icon, npt.marker_color
             FROM property_nearby_places pnp
             LEFT JOIN nearby_place_types npt ON npt.nearby_place_type_id = pnp.nearby_place_type_id
             WHERE pnp.property_id = ? AND pnp.delete_status = FALSE
             ORDER BY pnp.distance ASC`,
            [propertyId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching nearby places:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch nearby places" });
    }
};

const addPropertyNearbyPlace = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const {
            nearby_place_type_id,
            place_name,
            place_description,
            distance,
            distance_unit = "Kilometers",
            travel_time_minutes,
            travel_mode = "Driving",
            latitude,
            longitude,
            google_place_id,
            google_map_url,
            is_featured = false,
            display_order = 1,
            is_active = true,
            remarks
        } = req.body;

        if (!nearby_place_type_id || !place_name || distance === undefined) {
            return res.status(400).json({ success: false, message: "nearby_place_type_id, place_name, and distance are required" });
        }

        const [result] = await db.query(
            `INSERT INTO property_nearby_places (
                property_id, nearby_place_type_id, place_name, place_description,
                distance, distance_unit, travel_time_minutes, travel_mode,
                latitude, longitude, google_place_id, google_map_url,
                is_featured, display_order, is_active, remarks, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                propertyId, nearby_place_type_id, place_name, place_description || null,
                distance, distance_unit, travel_time_minutes || null, travel_mode,
                latitude || null, longitude || null, google_place_id || null, google_map_url || null,
                is_featured, display_order, is_active, remarks || null, req.user?.p_owner_id || req.user?.admin_id || null
            ]
        );

        const [created] = await db.query("SELECT * FROM property_nearby_places WHERE nearby_place_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Nearby place added", data: created[0] });
    } catch (error) {
        console.error("Error adding nearby place:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to add nearby place" });
    }
};

const updatePropertyNearbyPlace = async (req, res) => {
    try {
        const { placeId } = req.params;
        const body = { ...req.body };
        delete body.nearby_place_id;
        delete body.nearby_place_uuid;
        delete body.property_id;

        const fields = Object.keys(body);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const setClauses = fields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?";
        const values = [...Object.values(body), req.user?.p_owner_id || req.user?.admin_id || null, placeId];

        const [result] = await db.query(
            `UPDATE property_nearby_places SET ${setClauses} WHERE nearby_place_id = ? AND delete_status = FALSE`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Nearby place not found" });
        }

        const [updated] = await db.query("SELECT * FROM property_nearby_places WHERE nearby_place_id = ?", [placeId]);
        return res.status(200).json({ success: true, message: "Nearby place updated", data: updated[0] });
    } catch (error) {
        console.error("Error updating nearby place:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update nearby place" });
    }
};

const deletePropertyNearbyPlace = async (req, res) => {
    try {
        const { placeId } = req.params;
        const [result] = await db.query(
            "UPDATE property_nearby_places SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE nearby_place_id = ?",
            [req.user?.p_owner_id || req.user?.admin_id || null, placeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Nearby place not found" });
        }

        return res.status(200).json({ success: true, message: "Nearby place deleted" });
    } catch (error) {
        console.error("Error deleting nearby place:", error);
        return res.status(500).json({ success: false, message: "Failed to delete nearby place" });
    }
};

module.exports = {
    getPropertyNearbyPlaces,
    addPropertyNearbyPlace,
    updatePropertyNearbyPlace,
    deletePropertyNearbyPlace
};
