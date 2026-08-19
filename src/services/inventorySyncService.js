const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const VALID_TRANSACTION_TYPES = [
    "Opening Balance",
    "Booking",
    "Cancellation",
    "Modification",
    "Check-in",
    "Check-out",
    "Room Block",
    "Block Release",
    "Maintenance",
    "Maintenance Release",
    "Stop Sell",
    "Stop Sell Release",
    "Manual Adjustment",
    "Inventory Increase",
    "Inventory Decrease",
    "System Correction",
    "Overbooking"
];

const VALID_SOURCES = [
    "System",
    "Booking",
    "Admin",
    "Property Owner",
    "Channel Manager",
    "API",
    "Migration"
];

const normalizeTransactionType = (type) => {
    if (!type) return "Manual Adjustment";
    if (VALID_TRANSACTION_TYPES.includes(type)) return type;
    const lower = String(type).toLowerCase();
    if (lower.includes("block") && lower.includes("release")) return "Block Release";
    if (lower.includes("block")) return "Room Block";
    if (lower.includes("stop") && lower.includes("release")) return "Stop Sell Release";
    if (lower.includes("stop")) return "Stop Sell";
    if (lower.includes("maint") && lower.includes("release")) return "Maintenance Release";
    if (lower.includes("maint")) return "Maintenance";
    if (lower.includes("book") || lower.includes("reserv")) return "Booking";
    if (lower.includes("cancel")) return "Cancellation";
    if (lower.includes("increase") || lower.includes("add")) return "Inventory Increase";
    if (lower.includes("decrease") || lower.includes("reduc")) return "Inventory Decrease";
    return "Manual Adjustment";
};

const normalizeDirection = (dir, prevUnits = 0, newUnits = 0) => {
    if (dir === "Increase" || dir === "Decrease") return dir;
    const lower = String(dir || "").toLowerCase();
    if (lower === "addition" || lower === "increase" || lower === "in") return "Increase";
    if (lower === "reduction" || lower === "decrease" || lower === "out") return "Decrease";
    return (newUnits >= prevUnits) ? "Increase" : "Decrease";
};

const normalizeSource = (source) => {
    if (!source) return "Property Owner";
    if (VALID_SOURCES.includes(source)) return source;
    const lower = String(source).toLowerCase();
    if (lower.includes("admin")) return "Admin";
    if (lower.includes("book")) return "Booking";
    if (lower.includes("channel")) return "Channel Manager";
    if (lower.includes("api")) return "API";
    if (lower.includes("migrat")) return "Migration";
    if (lower.includes("system") || lower.includes("cron")) return "System";
    return "Property Owner";
};

/**
 * Ensures a room has a valid record in room_inventory
 */
const ensureRoomInventory = async (roomId, propertyId, userId = null) => {
    const [invRows] = await db.query(
        "SELECT * FROM room_inventory WHERE room_id = ? AND delete_status = FALSE LIMIT 1",
        [roomId]
    );

    if (invRows.length > 0) {
        return invRows[0];
    }

    // Lookup room details
    const [roomRows] = await db.query(
        "SELECT room_id, property_id, room_name, room_code, base_price FROM rooms WHERE room_id = ? LIMIT 1",
        [roomId]
    );

    const room = roomRows[0] || {};
    const code = room.room_code ? `INV-${room.room_code}` : `INV-RM-${roomId}`;
    const propId = propertyId || room.property_id;

    const [result] = await db.query(
        `INSERT INTO room_inventory (
            inventory_uuid, room_id, property_id, inventory_code,
            total_units, sellable_units, minimum_stock, maximum_stock,
            inventory_mode, allocation_mode, is_active, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            uuidv4(),
            roomId,
            propId,
            code,
            1,
            1,
            0,
            1,
            "Room Based",
            "Automatic",
            1,
            `Auto-configured inventory pool for ${room.room_name || `Room #${roomId}`}`,
            userId
        ]
    );

    const [created] = await db.query("SELECT * FROM room_inventory WHERE inventory_id = ?", [result.insertId]);
    return created[0];
};

/**
 * Generates an array of YYYY-MM-DD date strings between start and end (inclusive)
 */
const getDateRangeArray = (startDateStr, endDateStr) => {
    const dates = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    let curr = new Date(start);

    while (curr <= end) {
        dates.push(curr.toISOString().slice(0, 10));
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
};

/**
 * Synchronizes inventory_calendar for a given room and date range.
 * If roomId is not provided, synchronizes all rooms for the property.
 */
const syncCalendarForDateRange = async (propertyId, roomId, startDateStr, endDateStr, userId = null) => {
    try {
        if (!propertyId || !startDateStr || !endDateStr) return;

        let roomIds = [];
        if (roomId) {
            roomIds = [Number(roomId)];
        } else {
            const [rooms] = await db.query(
                "SELECT room_id FROM rooms WHERE property_id = ? AND delete_status = FALSE",
                [propertyId]
            );
            roomIds = rooms.map(r => r.room_id);
        }

        const dateList = getDateRangeArray(startDateStr, endDateStr);

        for (const rId of roomIds) {
            const inv = await ensureRoomInventory(rId, propertyId, userId);
            const totalUnits = Number(inv.total_units || 1);

            // Fetch room default base_price
            const [rInfo] = await db.query("SELECT base_price, discount_price FROM rooms WHERE room_id = ? LIMIT 1", [rId]);
            const defaultPrice = rInfo[0]?.base_price ? Number(rInfo[0].base_price) : null;
            const defaultDiscountPrice = rInfo[0]?.discount_price ? Number(rInfo[0].discount_price) : null;

            for (const dateStr of dateList) {
                // 1. Calculate active blocks for this room & date
                const [blocks] = await db.query(
                    `SELECT SUM(blocked_units) as total_blocked,
                            SUM(CASE WHEN block_type = 'Maintenance' THEN blocked_units ELSE 0 END) as maint_blocked
                     FROM room_blocks
                     WHERE property_id = ? AND room_id = ? AND ? BETWEEN start_date AND end_date
                       AND status IN ('Scheduled', 'Active') AND affects_inventory = TRUE`,
                    [propertyId, rId, dateStr]
                );

                const blockedUnits = Number(blocks[0]?.total_blocked || 0);
                const maintenanceUnits = Number(blocks[0]?.maint_blocked || 0);

                // 2. Check active stop-sell rules for this property/room & date
                const [stopSells] = await db.query(
                    `SELECT COUNT(*) as stop_sell_count
                     FROM stop_sell
                     WHERE property_id = ? AND (room_id = ? OR room_id IS NULL)
                       AND ? BETWEEN start_date AND end_date
                       AND status IN ('Scheduled', 'Active')`,
                    [propertyId, rId, dateStr]
                );

                const isStopSell = Number(stopSells[0]?.stop_sell_count || 0) > 0;
                const stopSellUnits = isStopSell ? totalUnits : 0;

                // 3. Get existing calendar record if any (to preserve existing bookings and custom daily pricing)
                const [existingCal] = await db.query(
                    "SELECT * FROM inventory_calendar WHERE inventory_id = ? AND inventory_date = ? LIMIT 1",
                    [inv.inventory_id, dateStr]
                );

                const bookedUnits = Number(existingCal[0]?.booked_units || 0);
                const dailyPrice = existingCal[0]?.daily_price !== undefined && existingCal[0]?.daily_price !== null
                    ? Number(existingCal[0].daily_price)
                    : defaultPrice;
                const dailyDiscountPrice = existingCal[0]?.daily_discount_price !== undefined && existingCal[0]?.daily_discount_price !== null
                    ? Number(existingCal[0].daily_discount_price)
                    : defaultDiscountPrice;

                // 4. Calculate available units and status
                const calculatedAvailable = Math.max(0, totalUnits - (bookedUnits + blockedUnits + stopSellUnits));
                const isAvailable = !isStopSell && calculatedAvailable > 0;
                const isSellable = !isStopSell;

                let inventoryStatus = "Available";
                if (isStopSell) {
                    inventoryStatus = "Stop Sell";
                } else if (maintenanceUnits > 0 && calculatedAvailable === 0) {
                    inventoryStatus = "Maintenance";
                } else if (blockedUnits > 0 && calculatedAvailable === 0) {
                    inventoryStatus = "Blocked";
                } else if (calculatedAvailable === 0) {
                    inventoryStatus = "Sold Out";
                } else if (calculatedAvailable <= 2) {
                    inventoryStatus = "Limited";
                }

                // 5. Upsert into inventory_calendar
                await db.query(
                    `INSERT INTO inventory_calendar (
                        inventory_id, room_id, property_id, inventory_date,
                        total_units, available_units, booked_units, blocked_units,
                        maintenance_units, stop_sell_units, daily_price, daily_discount_price,
                        is_sellable, is_available, inventory_status, created_by, updated_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        total_units = VALUES(total_units),
                        available_units = VALUES(available_units),
                        booked_units = VALUES(booked_units),
                        blocked_units = VALUES(blocked_units),
                        maintenance_units = VALUES(maintenance_units),
                        stop_sell_units = VALUES(stop_sell_units),
                        daily_price = VALUES(daily_price),
                        daily_discount_price = VALUES(daily_discount_price),
                        is_sellable = VALUES(is_sellable),
                        is_available = VALUES(is_available),
                        inventory_status = VALUES(inventory_status),
                        updated_by = ?`,
                    [
                        inv.inventory_id, rId, propertyId, dateStr,
                        totalUnits, calculatedAvailable, bookedUnits, blockedUnits,
                        maintenanceUnits, stopSellUnits, dailyPrice, dailyDiscountPrice,
                        isSellable, isAvailable, inventoryStatus, userId, userId,
                        userId
                    ]
                );
            }
        }
    } catch (err) {
        console.error("Error in syncCalendarForDateRange:", err);
    }
};

/**
 * Records an inventory transaction into inventory_transactions for the audit trail.
 * If roomId or inventoryId are missing, automatically resolves them so no NOT NULL constraint fails.
 */
const recordTransaction = async ({
    propertyId,
    roomId,
    inventoryId,
    transactionDate,
    transactionType = "Manual Adjustment",
    transactionDirection = "Increase",
    quantity = 0,
    previousAvailable = 0,
    newAvailable = 0,
    previousBooked = 0,
    newBooked = 0,
    previousBlocked = 0,
    newBlocked = 0,
    previousMaintenance = 0,
    newMaintenance = 0,
    previousStopSell = 0,
    newStopSell = 0,
    reason = "Manual Adjustment",
    remarks = null,
    source = "Property Owner",
    performedBy = null
}) => {
    try {
        if (!propertyId) return;

        const finalType = normalizeTransactionType(transactionType);
        const finalDirection = normalizeDirection(transactionDirection, previousAvailable, newAvailable);
        const finalSource = normalizeSource(source);

        // If roomId is provided, resolve inventoryId
        let targetRooms = [];
        if (roomId) {
            targetRooms.push(Number(roomId));
        } else {
            // Property-wide action: record for all rooms of the property
            const [rooms] = await db.query(
                "SELECT room_id FROM rooms WHERE property_id = ? AND delete_status = FALSE",
                [propertyId]
            );
            targetRooms = rooms.map(r => r.room_id);
        }

        for (const rId of targetRooms) {
            let invId = inventoryId;
            if (!invId) {
                const inv = await ensureRoomInventory(rId, propertyId, performedBy);
                invId = inv?.inventory_id;
            }

            if (!invId) continue;

            await db.query(
                `INSERT INTO inventory_transactions (
                    inventory_transaction_uuid, inventory_id, property_id, room_id,
                    transaction_date, transaction_type, transaction_direction,
                    quantity, previous_available_units, new_available_units,
                    previous_booked_units, new_booked_units,
                    previous_blocked_units, new_blocked_units,
                    previous_maintenance_units, new_maintenance_units,
                    previous_stop_sell_units, new_stop_sell_units,
                    reason, remarks, source, performed_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    uuidv4(),
                    invId,
                    propertyId,
                    rId,
                    transactionDate || new Date().toISOString().slice(0, 10),
                    finalType,
                    finalDirection,
                    quantity || 0,
                    previousAvailable || 0,
                    newAvailable || 0,
                    previousBooked || 0,
                    newBooked || 0,
                    previousBlocked || 0,
                    newBlocked || 0,
                    previousMaintenance || 0,
                    newMaintenance || 0,
                    previousStopSell || 0,
                    newStopSell || 0,
                    reason,
                    remarks,
                    finalSource,
                    performedBy
                ]
            );
        }
    } catch (err) {
        console.error("Error recording inventory transaction:", err);
    }
};

module.exports = {
    ensureRoomInventory,
    syncCalendarForDateRange,
    recordTransaction
};
