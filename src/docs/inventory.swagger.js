const { errorResponse } = require("./schemas.swagger");

const inventoryTags = [
    { name: "Inventory & Calendar", description: "Room stock inventory setup, daily calendar availability, inventory transactions audit, room blockings, and stop-sell restrictions." }
];

const inventoryPaths = {
    // Room Inventory Setup
    "/api/v1/inventory/rooms": {
        get: {
            tags: ["Inventory & Calendar"],
            summary: "List room inventory configurations",
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "room_id", in: "query", schema: { type: "integer" } }
            ],
            responses: { "200": { description: "List of inventory configurations." } }
        },
        post: {
            tags: ["Inventory & Calendar"],
            summary: "Configure inventory settings for room",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["room_id", "property_id", "inventory_code"],
                            properties: {
                                room_id: { type: "integer", example: 1 },
                                property_id: { type: "integer", example: 1 },
                                inventory_code: { type: "string", example: "INV-DLX-101" },
                                total_units: { type: "integer", example: 5 },
                                sellable_units: { type: "integer", example: 5 },
                                overbooking_allowed: { type: "boolean", example: false }
                            }
                        }
                    }
                }
            },
            responses: { "200": { description: "Inventory configured successfully." } }
        }
    },
    // Calendar
    "/api/v1/inventory/calendar": {
        get: {
            tags: ["Inventory & Calendar"],
            summary: "Get daily inventory availability calendar by date range",
            parameters: [
                { name: "start_date", in: "query", required: true, schema: { type: "string", format: "date" }, example: "2026-08-01" },
                { name: "end_date", in: "query", required: true, schema: { type: "string", format: "date" }, example: "2026-08-31" },
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "room_id", in: "query", schema: { type: "integer" } }
            ],
            responses: { "200": { description: "Calendar availability records." } }
        },
        post: {
            tags: ["Inventory & Calendar"],
            summary: "Update or override daily calendar availability / restrictions",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["inventory_id", "room_id", "property_id", "inventory_date", "total_units"],
                            properties: {
                                inventory_id: { type: "integer", example: 1 },
                                room_id: { type: "integer", example: 1 },
                                property_id: { type: "integer", example: 1 },
                                inventory_date: { type: "string", format: "date", example: "2026-08-15" },
                                total_units: { type: "integer", example: 5 },
                                available_units: { type: "integer", example: 3 },
                                closed_for_arrival: { type: "boolean", example: false },
                                closed_for_departure: { type: "boolean", example: false },
                                is_sellable: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: { "200": { description: "Calendar updated." } }
        }
    },
    // Transactions
    "/api/v1/inventory/transactions": {
        get: {
            tags: ["Inventory & Calendar"],
            summary: "Get inventory transaction audit trail",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "room_id", in: "query", schema: { type: "integer" } },
                { name: "transaction_type", in: "query", schema: { type: "string" } }
            ],
            responses: { "200": { description: "List of inventory transactions." } }
        },
        post: {
            tags: ["Inventory & Calendar"],
            summary: "Record manual inventory adjustment transaction",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["inventory_id", "property_id", "room_id", "transaction_date", "transaction_type", "transaction_direction"],
                            properties: {
                                inventory_id: { type: "integer", example: 1 },
                                property_id: { type: "integer", example: 1 },
                                room_id: { type: "integer", example: 1 },
                                transaction_date: { type: "string", format: "date", example: "2026-08-15" },
                                transaction_type: { type: "string", example: "Manual Adjustment" },
                                transaction_direction: { type: "string", enum: ["Increase", "Decrease"] },
                                quantity: { type: "integer", example: 2 },
                                reason: { type: "string", example: "Extra units made ready after maintenance" }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Transaction recorded." } }
        }
    },
    // Room Blocks
    "/api/v1/inventory/blocks": {
        get: {
            tags: ["Inventory & Calendar"],
            summary: "List room blocks (maintenance, VIP, owner use)",
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "room_id", in: "query", schema: { type: "integer" } },
                { name: "status", in: "query", schema: { type: "string" } }
            ],
            responses: { "200": { description: "List of room blocks." } }
        },
        post: {
            tags: ["Inventory & Calendar"],
            summary: "Create room block",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["property_id", "room_id", "start_date", "end_date"],
                            properties: {
                                property_id: { type: "integer", example: 1 },
                                room_id: { type: "integer", example: 1 },
                                block_type: { type: "string", example: "Maintenance" },
                                block_reason: { type: "string", example: "Bathroom renovation" },
                                start_date: { type: "string", format: "date", example: "2026-08-20" },
                                end_date: { type: "string", format: "date", example: "2026-08-25" },
                                blocked_units: { type: "integer", example: 1 }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Room block created." } }
        }
    },
    "/api/v1/inventory/blocks/release/{blockId}": {
        put: {
            tags: ["Inventory & Calendar"],
            summary: "Release active room block",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "blockId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "Room block released." } }
        }
    },
    // Stop Sell
    "/api/v1/inventory/stop-sell": {
        get: {
            tags: ["Inventory & Calendar"],
            summary: "List stop sell restrictions",
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "room_id", in: "query", schema: { type: "integer" } }
            ],
            responses: { "200": { description: "List of stop sell rules." } }
        },
        post: {
            tags: ["Inventory & Calendar"],
            summary: "Create stop sell restriction",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["property_id", "start_date", "end_date"],
                            properties: {
                                property_id: { type: "integer", example: 1 },
                                room_id: { type: "integer", example: 1 },
                                stop_sell_type: { type: "string", example: "Room" },
                                reason_type: { type: "string", example: "High Demand" },
                                start_date: { type: "string", format: "date", example: "2026-08-14" },
                                end_date: { type: "string", format: "date", example: "2026-08-17" }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Stop sell created." } }
        }
    },
    "/api/v1/inventory/stop-sell/release/{id}": {
        put: {
            tags: ["Inventory & Calendar"],
            summary: "Release stop sell restriction",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "Stop sell released." } }
        }
    }
};

module.exports = {
    inventoryTags,
    inventoryPaths
};
