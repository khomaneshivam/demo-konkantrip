const { errorResponse } = require("./schemas.swagger");

const adminDashboardTags = [
    { name: "Admin Dashboard", description: "Operations for managing property owners and monitoring pending property approvals." }
];

const adminDashboardPaths = {
    "/api/v1/admin/dashboard/owners": {
        get: {
            tags: ["Admin Dashboard"],
            summary: "List all property owners",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20 } }
            ],
            responses: {
                "200": {
                    description: "Returns a paginated list of property owners.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    pagination: { type: "object" },
                                    count: { type: "integer" },
                                    data: { type: "array", items: { type: "object" } }
                                }
                            }
                        }
                    }
                },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required.")
            }
        }
    },
    "/api/v1/admin/dashboard/owners/{owner_id}/properties": {
        get: {
            tags: ["Admin Dashboard"],
            summary: "List properties for a specific owner",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "owner_id", in: "path", required: true, schema: { type: "integer", example: 1 } }
            ],
            responses: {
                "200": {
                    description: "List of properties.",
                    content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, data: { type: "array" } } } } }
                }
            }
        }
    },
    "/api/v1/admin/dashboard/properties/{id}": {
        get: {
            tags: ["Admin Dashboard"],
            summary: "Get property details by ID",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
            ],
            responses: {
                "200": {
                    description: "Property Details.",
                    content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, data: { type: "object" } } } } }
                }
            }
        }
    },
    "/api/v1/admin/dashboard/properties/pending": {
        get: {
            tags: ["Admin Dashboard"],
            summary: "List all pending properties",
            security: [{ BearerAuth: [] }],
            responses: {
                "200": {
                    description: "List of pending properties.",
                    content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, data: { type: "array" } } } } }
                }
            }
        }
    },
    "/api/v1/admin/dashboard/properties/{id}/approve": {
        put: {
            tags: ["Admin Dashboard"],
            summary: "Approve or reject a property",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["status"],
                            properties: {
                                status: { type: "string", enum: ["Approved", "Rejected"] },
                                remarks: { type: "string", description: "Optional reasons for approval or rejection" }
                            }
                        }
                    }
                }
            },
            responses: {
                "200": {
                    description: "Property successfully updated.",
                    content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" } } } } }
                },
                "400": errorResponse("Status must be Approved or Rejected."),
                "404": errorResponse("Property not found.")
            }
        }
    }
};

module.exports = {
    adminDashboardTags,
    adminDashboardPaths
};
