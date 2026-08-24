const db = require("../../config/db");
const { isAdmin } = require("../../middlewares/roleMiddleware");
const { syncCalendarForDateRange } = require("../../services/inventorySyncService");

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

        if (include_inactive === "false" || include_inactive === "0") {
            query += " AND rsr.is_active = TRUE";
        }

        query += " ORDER BY rsr.start_date ASC, rsr.created_at DESC";

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error fetching room rates:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to fetch room rates" });
    }
};

// Create a new seasonal/promotional rate rule
const createRoomRate = async (req, res) => {
    try {
        const { roomId } = req.params;
        const {
            property_id,
            room_id,
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

        const targetRoomId = (roomId && roomId !== "all") ? Number(roomId) : Number(room_id);

        if (!property_id || !targetRoomId || !rate_name || !start_date || !end_date || base_price === undefined) {
            return res.status(400).json({
                success: false,
                message: "property_id, room_id, rate_name, start_date, end_date, and base_price are required"
            });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({
                success: false,
                message: "start_date cannot be later than end_date"
            });
        }

        // Verify ownership
        if (!isAdmin(req.user)) {
            const [prop] = await db.query(
                "SELECT p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
                [property_id]
            );
            if (prop.length === 0) {
                return res.status(404).json({ success: false, message: "Property not found" });
            }
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(prop[0].p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(property_id))
            );
            if (!isOwner && !isEmployee) {
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

        // Sync calendar for the date range
        try {
            const sStr = typeof start_date === "string" ? start_date.slice(0, 10) : "";
            const eStr = typeof end_date === "string" ? end_date.slice(0, 10) : "";
            if (sStr && eStr) {
                await syncCalendarForDateRange(property_id, targetRoomId, sStr, eStr, userId);
            }
        } catch (_) {}

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

        // Verify existing rate and ownership
        const [existing] = await db.query(
            `SELECT rsr.*, p.p_owner_id 
             FROM room_seasonal_rates rsr 
             INNER JOIN properties p ON p.property_id = rsr.property_id 
             WHERE rsr.rate_id = ? AND rsr.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [rateId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Rate rule not found" });
        }

        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(existing[0].p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(existing[0].property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to modify rate rule for this property" });
            }
        }

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

        // Sync calendar for the date range
        try {
            if (updated.length > 0) {
                const sStr = updated[0].start_date ? (updated[0].start_date.toISOString ? updated[0].start_date.toISOString().slice(0, 10) : String(updated[0].start_date).slice(0, 10)) : "";
                const eStr = updated[0].end_date ? (updated[0].end_date.toISOString ? updated[0].end_date.toISOString().slice(0, 10) : String(updated[0].end_date).slice(0, 10)) : "";
                if (sStr && eStr) {
                    await syncCalendarForDateRange(updated[0].property_id, updated[0].room_id, sStr, eStr, userId);
                }
            }
        } catch (_) {}

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

        const [existing] = await db.query(
            `SELECT rsr.*, p.p_owner_id 
             FROM room_seasonal_rates rsr 
             INNER JOIN properties p ON p.property_id = rsr.property_id 
             WHERE rsr.rate_id = ? AND rsr.delete_status = FALSE AND p.delete_status = FALSE LIMIT 1`,
            [rateId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Rate rule not found" });
        }

        if (!isAdmin(req.user)) {
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(existing[0].p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(existing[0].property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to delete rate rule for this property" });
            }
        }

        const [result] = await db.query(
            "UPDATE room_seasonal_rates SET delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE rate_id = ? AND delete_status = FALSE",
            [userId, rateId]
        );

        // Sync calendar to restore standard rates for the date range
        try {
            const sStr = existing[0].start_date ? (existing[0].start_date.toISOString ? existing[0].start_date.toISOString().slice(0, 10) : String(existing[0].start_date).slice(0, 10)) : "";
            const eStr = existing[0].end_date ? (existing[0].end_date.toISOString ? existing[0].end_date.toISOString().slice(0, 10) : String(existing[0].end_date).slice(0, 10)) : "";
            if (sStr && eStr) {
                await syncCalendarForDateRange(existing[0].property_id, existing[0].room_id, sStr, eStr, userId);
            }
        } catch (_) {}

        return res.status(200).json({ success: true, message: "Seasonal rate deleted successfully" });
    } catch (error) {
        console.error("Error deleting room rate:", error);
        return res.status(500).json({ success: false, message: "Failed to delete room rate" });
    }
};

// Bulk update room prices (base price, discount, percentage, extra adult/child)
const bulkUpdatePricing = async (req, res) => {
    try {
        const {
            room_ids,
            property_id,
            action = "set_price", // "set_price" | "adjust_percent" | "adjust_fixed" | "set_discount" | "clear_discount" | "set_extra_adult" | "set_extra_child" | "individual"
            base_price,
            discount_price,
            percentage,
            fixed_amount,
            extra_adult_price,
            extra_child_price,
            items
        } = req.body;

        let targetRoomIds = Array.isArray(room_ids) ? room_ids.map(Number) : [];

        if (Array.isArray(items) && items.length > 0) {
            targetRoomIds = items.map(i => Number(i.room_id));
        }

        if (targetRoomIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one room_id or items array must be provided for bulk pricing update"
            });
        }

        // Fetch existing rooms to verify ownership and compute changes
        const [rooms] = await db.query(
            `SELECT r.*, p.p_owner_id, p.property_name 
             FROM rooms r 
             INNER JOIN properties p ON p.property_id = r.property_id
             WHERE r.room_id IN (?) AND r.delete_status = FALSE AND p.delete_status = FALSE`,
            [targetRoomIds]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: "No active rooms found for the provided IDs" });
        }

        // Verify management access
        const currentUserId = req.user?.p_owner_id || req.user?.admin_id || req.user?.employee_id || null;
        if (!isAdmin(req.user)) {
            if (req.user?.user_type === "owner" || req.user?.p_owner_id) {
                const unauthorized = rooms.find(r => Number(r.p_owner_id) !== Number(req.user.p_owner_id));
                if (unauthorized) {
                    return res.status(403).json({ success: false, message: "Unauthorized to update prices for some selected rooms" });
                }
            } else if (req.user?.user_type === "employee" || req.user?.employee_id) {
                const assigned = Array.isArray(req.user.assigned_properties) ? req.user.assigned_properties.map(Number) : [];
                const unauthorized = rooms.find(r => !assigned.includes(Number(r.property_id)));
                if (unauthorized) {
                    return res.status(403).json({ success: false, message: "You are not assigned to manage pricing for one or more selected properties" });
                }
            } else {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }
        }

        const itemsMap = Array.isArray(items) ? new Map(items.map(i => [Number(i.room_id), i])) : null;
        const updatedRooms = [];
        const affectedPropertyIds = new Set();

        for (const room of rooms) {
            let newBasePrice = Number(room.base_price) || 0;
            let newDiscountPrice = room.discount_price !== null && room.discount_price !== undefined ? Number(room.discount_price) : null;
            let newExtraAdultPrice = Number(room.extra_adult_price) || 0;
            let newExtraChildPrice = Number(room.extra_child_price) || 0;

            if (itemsMap && itemsMap.has(room.room_id)) {
                const item = itemsMap.get(room.room_id);
                if (item.base_price !== undefined) newBasePrice = Number(item.base_price);
                if (item.discount_price !== undefined) newDiscountPrice = item.discount_price !== null && item.discount_price !== "" ? Number(item.discount_price) : null;
                if (item.extra_adult_price !== undefined) newExtraAdultPrice = Number(item.extra_adult_price);
                if (item.extra_child_price !== undefined) newExtraChildPrice = Number(item.extra_child_price);
            } else {
                switch (action) {
                    case "set_price":
                        if (base_price !== undefined) newBasePrice = Math.max(0, Number(base_price));
                        if (discount_price !== undefined) newDiscountPrice = discount_price !== null && discount_price !== "" ? Math.max(0, Number(discount_price)) : null;
                        if (extra_adult_price !== undefined) newExtraAdultPrice = Math.max(0, Number(extra_adult_price));
                        if (extra_child_price !== undefined) newExtraChildPrice = Math.max(0, Number(extra_child_price));
                        break;
                    case "adjust_percent": {
                        const pct = Number(percentage) || 0;
                        newBasePrice = Math.max(0, Math.round(newBasePrice * (1 + pct / 100)));
                        if (newDiscountPrice !== null) {
                            newDiscountPrice = Math.max(0, Math.round(newDiscountPrice * (1 + pct / 100)));
                        }
                        break;
                    }
                    case "adjust_fixed": {
                        const amt = Number(fixed_amount) || 0;
                        newBasePrice = Math.max(0, newBasePrice + amt);
                        if (newDiscountPrice !== null) {
                            newDiscountPrice = Math.max(0, newDiscountPrice + amt);
                        }
                        break;
                    }
                    case "set_discount":
                        if (discount_price !== undefined && discount_price !== null && discount_price !== "") {
                            newDiscountPrice = Math.max(0, Number(discount_price));
                        } else if (percentage !== undefined) {
                            const pct = Math.max(0, Math.min(100, Number(percentage)));
                            newDiscountPrice = Math.max(0, Math.round(newBasePrice * (1 - pct / 100)));
                        }
                        break;
                    case "clear_discount":
                        newDiscountPrice = null;
                        break;
                    case "set_extra_adult":
                        if (extra_adult_price !== undefined) newExtraAdultPrice = Math.max(0, Number(extra_adult_price));
                        break;
                    case "set_extra_child":
                        if (extra_child_price !== undefined) newExtraChildPrice = Math.max(0, Number(extra_child_price));
                        break;
                }
            }

            await db.query(
                `UPDATE rooms 
                 SET base_price = ?, discount_price = ?, extra_adult_price = ?, extra_child_price = ?, updated_by = ?
                 WHERE room_id = ? AND delete_status = FALSE`,
                [newBasePrice, newDiscountPrice, newExtraAdultPrice, newExtraChildPrice, currentUserId, room.room_id]
            );

            affectedPropertyIds.add(Number(room.property_id));

            updatedRooms.push({
                room_id: room.room_id,
                room_name: room.room_name,
                old_base_price: room.base_price,
                new_base_price: newBasePrice,
                old_discount_price: room.discount_price,
                new_discount_price: newDiscountPrice,
                extra_adult_price: newExtraAdultPrice,
                extra_child_price: newExtraChildPrice
            });
        }

        // Sync starting prices for all affected properties and sync inventory calendar
        const { syncPropertyStartingPrice } = require("./rooms");
        const todayStr = new Date().toISOString().slice(0, 10);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 90);
        const futureStr = futureDate.toISOString().slice(0, 10);

        for (const propId of affectedPropertyIds) {
            await syncPropertyStartingPrice(propId);
            try {
                await syncCalendarForDateRange(propId, null, todayStr, futureStr, currentUserId);
            } catch (_) {}
        }

        // Record Audit Trail
        try {
            const AuditService = require("../../services/auditService");
            await AuditService.logAudit({
                req,
                property_id: Array.from(affectedPropertyIds)[0] || property_id || null,
                module: "Pricing",
                action: "UPDATE",
                record_id: updatedRooms[0]?.room_id || null,
                record_name: `Bulk pricing update (${updatedRooms.length} rooms)`,
                new_values: { action, count: updatedRooms.length, updatedRooms },
                description: `Bulk updated pricing across ${updatedRooms.length} room(s) using action: ${action}`
            });
        } catch (_) {}

        return res.status(200).json({
            success: true,
            message: `Successfully updated pricing for ${updatedRooms.length} room(s)`,
            count: updatedRooms.length,
            data: updatedRooms
        });
    } catch (error) {
        console.error("Error in bulkUpdatePricing:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to perform bulk price update" });
    }
};

// Bulk create seasonal rates across multiple rooms
const bulkCreateSeasonalRates = async (req, res) => {
    try {
        const {
            room_ids,
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

        const targetRoomIds = Array.isArray(room_ids) ? room_ids.map(Number) : [];

        if (targetRoomIds.length === 0 || !property_id || !rate_name || !start_date || !end_date || base_price === undefined) {
            return res.status(400).json({
                success: false,
                message: "room_ids (array), property_id, rate_name, start_date, end_date, and base_price are required"
            });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ success: false, message: "start_date cannot be later than end_date" });
        }

        // Verify property ownership
        if (!isAdmin(req.user)) {
            const [prop] = await db.query(
                "SELECT p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
                [property_id]
            );
            if (prop.length === 0) {
                return res.status(404).json({ success: false, message: "Property not found" });
            }
            const isOwner = req.user?.p_owner_id && Number(req.user.p_owner_id) === Number(prop[0].p_owner_id);
            const isEmployee = req.user?.employee_id && (
                Array.isArray(req.user.assigned_properties) && req.user.assigned_properties.map(Number).includes(Number(property_id))
            );
            if (!isOwner && !isEmployee) {
                return res.status(403).json({ success: false, message: "Unauthorized to set rate rules for this property" });
            }
        }

        const userId = req.user?.p_owner_id || req.user?.admin_id || null;
        const createdRates = [];

        for (const roomId of targetRoomIds) {
            const [result] = await db.query(
                `INSERT INTO room_seasonal_rates (
                    room_id, property_id, rate_name, start_date, end_date,
                    base_price, discount_price, extra_adult_price, extra_child_price,
                    days_of_week, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    roomId,
                    property_id,
                    rate_name,
                    start_date,
                    end_date,
                    Number(base_price),
                    discount_price !== undefined && discount_price !== null && discount_price !== "" ? Number(discount_price) : null,
                    Number(extra_adult_price),
                    Number(extra_child_price),
                    Array.isArray(days_of_week) ? days_of_week.join(",") : days_of_week || null,
                    is_active ? 1 : 0,
                    userId
                ]
            );
            createdRates.push(result.insertId);

            // Sync calendar for this room and date range
            try {
                const sStr = typeof start_date === "string" ? start_date.slice(0, 10) : "";
                const eStr = typeof end_date === "string" ? end_date.slice(0, 10) : "";
                if (sStr && eStr) {
                    await syncCalendarForDateRange(property_id, roomId, sStr, eStr, userId);
                }
            } catch (_) {}
        }

        return res.status(201).json({
            success: true,
            message: `Created seasonal rate rules for ${createdRates.length} room(s)`,
            count: createdRates.length,
            data: { createdRateIds: createdRates }
        });
    } catch (error) {
        console.error("Error in bulkCreateSeasonalRates:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to bulk create seasonal rates" });
    }
};

module.exports = {
    getRoomRates,
    createRoomRate,
    updateRoomRate,
    deleteRoomRate,
    bulkUpdatePricing,
    bulkCreateSeasonalRates
};

