const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireOwnerOrAdmin } = require("../../middlewares/roleMiddleware");

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
router.post("/rooms", authMiddleware, requireOwnerOrAdmin, upsertRoomInventory);
router.delete("/rooms/:id", authMiddleware, requireOwnerOrAdmin, deleteRoomInventory);

// 2. Inventory Calendar
router.get("/calendar", getInventoryCalendar);
router.post("/calendar", authMiddleware, requireOwnerOrAdmin, updateInventoryCalendarDay);

// 3. Transactions / Audit Trail
router.get("/transactions", authMiddleware, requireOwnerOrAdmin, getInventoryTransactions);
router.post("/transactions", authMiddleware, requireOwnerOrAdmin, createInventoryTransaction);

// 4. Room Blocks
router.get("/blocks", getRoomBlocks);
router.post("/blocks", authMiddleware, requireOwnerOrAdmin, createRoomBlock);
router.put("/blocks/release/:blockId", authMiddleware, requireOwnerOrAdmin, releaseRoomBlock);
router.put("/blocks/cancel/:blockId", authMiddleware, requireOwnerOrAdmin, cancelRoomBlock);

// 5. Stop Sell Restrictions
router.get("/stop-sell", getStopSellRules);
router.post("/stop-sell", authMiddleware, requireOwnerOrAdmin, createStopSellRule);
router.put("/stop-sell/release/:id", authMiddleware, requireOwnerOrAdmin, releaseStopSellRule);
router.put("/stop-sell/cancel/:id", authMiddleware, requireOwnerOrAdmin, cancelStopSellRule);

module.exports = router;
