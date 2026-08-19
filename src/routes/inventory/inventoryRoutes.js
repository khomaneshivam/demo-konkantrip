const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireManagementAccess } = require("../../middlewares/roleMiddleware");

// Controllers
const {
    getRoomInventory,
    getRoomInventoryById,
    upsertRoomInventory,
    deleteRoomInventory
} = require("../../controllers/inventory/roomInventory");

const {
    getInventoryCalendar,
    updateInventoryCalendarDay
} = require("../../controllers/inventory/inventoryCalendar");

const {
    getInventoryTransactions,
    createInventoryTransaction
} = require("../../controllers/inventory/inventoryTransactions");

const {
    getRoomBlocks,
    createRoomBlock,
    releaseRoomBlock,
    cancelRoomBlock
} = require("../../controllers/inventory/roomBlocks");

const {
    getStopSellRules,
    createStopSellRule,
    releaseStopSellRule,
    cancelStopSellRule
} = require("../../controllers/inventory/stopSell");

// 1. Room Inventory Setup
router.get("/rooms", getRoomInventory);
router.get("/rooms/:id", getRoomInventoryById);
router.post("/rooms", authMiddleware, requireManagementAccess("inventory:update"), upsertRoomInventory);
router.delete("/rooms/:id", authMiddleware, requireManagementAccess("inventory:update"), deleteRoomInventory);

// 2. Inventory Calendar
router.get("/calendar", getInventoryCalendar);
router.post("/calendar", authMiddleware, requireManagementAccess("inventory:update"), updateInventoryCalendarDay);

// 3. Transactions / Audit Trail
router.get("/transactions", authMiddleware, requireManagementAccess("inventory:read"), getInventoryTransactions);
router.post("/transactions", authMiddleware, requireManagementAccess("inventory:update"), createInventoryTransaction);

// 4. Room Blocks
router.get("/blocks", getRoomBlocks);
router.post("/blocks", authMiddleware, requireManagementAccess("inventory:manage_blocks"), createRoomBlock);
router.put("/blocks/release/:blockId", authMiddleware, requireManagementAccess("inventory:manage_blocks"), releaseRoomBlock);
router.put("/blocks/cancel/:blockId", authMiddleware, requireManagementAccess("inventory:manage_blocks"), cancelRoomBlock);

// 5. Stop Sell Restrictions
router.get("/stop-sell", getStopSellRules);
router.post("/stop-sell", authMiddleware, requireManagementAccess("inventory:manage_stopsell"), createStopSellRule);
router.put("/stop-sell/release/:id", authMiddleware, requireManagementAccess("inventory:manage_stopsell"), releaseStopSellRule);
router.put("/stop-sell/cancel/:id", authMiddleware, requireManagementAccess("inventory:manage_stopsell"), cancelStopSellRule);

module.exports = router;
