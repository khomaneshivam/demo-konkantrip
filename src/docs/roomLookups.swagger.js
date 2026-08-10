const { errorResponse } = require("./schemas.swagger");

const roomLookupTags = [
    { name: "Room Lookups", description: "Catalogs for bed types, room types, room statuses, room views, room image types, and room facilities." }
];

const createRoomLookupSwaggerPaths = (basePath, entityName) => {
    return {
        [`/api/v1/lookups/rooms/${basePath}`]: {
            get: {
                tags: ["Room Lookups"],
                summary: `List all ${entityName}`,
                parameters: [
                    { name: "active_only", in: "query", schema: { type: "boolean" }, description: "Filter only active records" }
                ],
                responses: {
                    "200": {
                        description: `List of ${entityName}.`,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { type: "array", items: { type: "object" } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["Room Lookups"],
                summary: `Create a new ${entityName} (Admin only)`,
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object" } } }
                },
                responses: {
                    "201": { description: `${entityName} created successfully.` },
                    "400": errorResponse("Validation error."),
                    "401": errorResponse("Unauthorized."),
                    "403": errorResponse("Admin access required.")
                }
            }
        },
        [`/api/v1/lookups/rooms/${basePath}/{id}`]: {
            get: {
                tags: ["Room Lookups"],
                summary: `Get ${entityName} by ID`,
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: {
                    "200": { description: `${entityName} details.` },
                    "404": errorResponse(`${entityName} not found.`)
                }
            },
            put: {
                tags: ["Room Lookups"],
                summary: `Update ${entityName} (Admin only)`,
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object" } } }
                },
                responses: {
                    "200": { description: `${entityName} updated.` },
                    "401": errorResponse("Unauthorized."),
                    "403": errorResponse("Admin access required."),
                    "404": errorResponse(`${entityName} not found.`)
                }
            },
            delete: {
                tags: ["Room Lookups"],
                summary: `Delete ${entityName} (Admin only)`,
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: {
                    "200": { description: `${entityName} deleted.` },
                    "401": errorResponse("Unauthorized."),
                    "403": errorResponse("Admin access required."),
                    "404": errorResponse(`${entityName} not found.`)
                }
            }
        }
    };
};

const roomLookupPaths = {
    ...createRoomLookupSwaggerPaths("bed-types", "Bed Type"),
    ...createRoomLookupSwaggerPaths("room-types", "Room Type"),
    ...createRoomLookupSwaggerPaths("room-status", "Room Status"),
    ...createRoomLookupSwaggerPaths("room-views", "Room View"),
    ...createRoomLookupSwaggerPaths("room-image-types", "Room Image Type"),
    ...createRoomLookupSwaggerPaths("facility-categories", "Facility Category"),
    ...createRoomLookupSwaggerPaths("facilities", "Facility")
};

module.exports = {
    roomLookupTags,
    roomLookupPaths
};
