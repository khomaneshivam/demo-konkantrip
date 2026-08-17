const db = require("../../config/db");
const { isAdmin } = require("../../middlewares/roleMiddleware");

// Get all seasonal rates for a room or property
const getRoomRates = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { property_id, include_inactive = "false" } = req.query;

        let query = `
            SELECT rsr.*, r.room_name, r.room_code, p.property_name
            FROM room_seasonal_rates rsr
            INNER JOIN rooms r ON r.room_id = rsr.room_id
            INNER JOIN properties p ON p.property_id = rsr.property_id
            WHERE rsr.delete_status = FALSE AND r.delete_status = FALSE AND p.delete_status = FALSE
        `;
        const params = [];

        if (roomId && roomId !== "all") {
            query += " AND rsr.room_id = ?";
            params.push(roomId);
        }

        if (property_id) {
            query += " AND rsr.property_id = ?";
            params.push(property_id);
        }

        if (include_inactive !== "true" && include_inactive !== "1") {
            query += " AND rsr.is_active = TRUE";
        }

        query += " ORDER BY rsr.start_date ASC, rsr.created_at DESC";

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching room rates:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch room rates" });
    }
};

// Create a new seasonal/discounted rate rule for a room
const createRoomRate = async (req, res) => {
    try {
        const { roomId } = req.params;
        const {
            property_id,
            rate_name,
            start_date,
            end_date,
            base_price,
            discount_price,
            extra_adult_price = 0,
            extra_child_price = 0,
            days_of_week,
            is_active = true
        } = req.body;

        const targetRoomId = roomId && roomId !== "all" ? roomId : req.body.room_id;

        if (!targetRoomId || !property_id || !rate_name || !start_date || !end_date || base_price === undefined) {
            return res.status(400).json({
                success: false,
                message: "room_id, property_id, rate_name, start_date, end_date, and base_price are required"
            });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({
                success: false,
                message: "start_date cannot be later than end_date"
            });
        }

        // Check ownership
        if (!isAdmin(req.user)) {
            const [prop] = await db.query(
                "SELECT p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
                [property_id]
            );
            if (prop.length === 0 || Number(prop[0].p_owner_id) !== Number(req.user?.p_owner_id)) {
                return res.status(403).json({ success: false, message: "Unauthorized to set rate rules for this property" });
            }
        }

        const userId = req.user?.p_owner_id || req.user?.admin_id || null;

        const [result] = await db.query(
            `INSERT INTO room_seasonal_rates (
                room_id, property_id, rate_name, start_date, end_date,
                base_price, discount_price, extra_adult_price, extra_child_price,
                days_of_week, is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                targetRoomId,
                property_id,
                rate_name,
                start_date,
                end_date,
                Number(base_price),
                discount_price !== undefined && discount_price !== null && discount_price !== "" ? Number(discount_price) : null,
                Number(extra_adult_price),
                Number(extra_child_price),
                days_of_week || null,
                is_active ? 1 : 0,
                userId
            ]
        );

        const [created] = await db.query(
            "SELECT * FROM room_seasonal_rates WHERE rate_id = ? LIMIT 1",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Seasonal rate created successfully",
            data: created[0]
        });
    } catch (error) {
        console.error("Error creating room rate:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create room rate" });
    }
};

// Update an existing rate rule
const updateRoomRate = async (req, res) => {
    try {
        const { rateId } = req.params;
        const body = { ...req.body };

        delete body.rate_id;
        delete body.room_id;
        delete body.property_id;

        if (body.start_date && body.end_date && new Date(body.start_date) > new Date(body.end_date)) {
            return res.status(400).json({ success: false, message: "start_date cannot be later than end_date" });
        }

        const fields = Object.keys(body);
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const setClauses = fields.map(f => `${f} = ?`).join(", ") + ", updated_by = ?";
        const userId = req.user?.p_owner_id || req.user?.admin_id || null;
        const values = [...Object.values(body), userId, rateId];

        const [result] = await db.query(
            `UPDATE room_seasonal_rates SET ${setClauses} WHERE rate_id = ? AND delete_status = FALSE`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Rate rule not found" });
        }

        const [updated] = await db.query(
            "SELECT * FROM room_seasonal_rates WHERE rate_id = ? LIMIT 1",
            [rateId]
        );

        return res.status(200).json({
            success: true,
            message: "Seasonal rate updated successfully",
            data: updated[0]
        });
    } catch (error) {
        console.error("Error updating room rate:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update room rate" });
    }
};

// Soft delete a rate rule
const deleteRoomRate = async (req, res) => {
    try {
        const { rateId } = req.params;
        const userId = req.user?.p_owner_id || req.user?.admin_id || null;

        const [result] = await db.query(
            "UPDATE room_seasonal_rates SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE rate_id = ? AND delete_status = FALSE",
            [userId, rateId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Rate rule not found" });
        }

        return res.status(200).json({ success: true, message: "Seasonal rate deleted successfully" });
    } catch (error) {
        console.error("Error deleting room rate:", error);
        return res.status(500).json({ success: false, message: "Failed to delete room rate" });
    }
};

module.exports = {
    getRoomRates,
    createRoomRate,
    updateRoomRate,
    deleteRoomRate
};
