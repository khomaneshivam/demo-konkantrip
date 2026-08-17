const { errorResponse } = require("./schemas.swagger");

const propertyTags = [
    { name: "Properties", description: "Property catalogue management, discovery, status approvals, and address locations." }
];

const propertyPaths = {
    "/api/v1/properties": {
        get: {
            tags: ["Properties"],
            summary: "Search and filter properties",
            parameters: [
                { name: "property_name", in: "query", schema: { type: "string" }, description: "Partial match property name" },
                { name: "property_type", in: "query", schema: { type: "string" }, description: "Hotel, Resort, Villa, etc." },
                { name: "property_category", in: "query", schema: { type: "string" }, description: "Budget, Standard, Luxury, etc." },
                { name: "property_status", in: "query", schema: { type: "string" }, description: "Draft, Approved, Pending, etc." },
                { name: "p_owner_id", in: "query", schema: { type: "integer" }, description: "Owner ID filter" },
                { name: "is_featured", in: "query", schema: { type: "boolean" } },
                { name: "is_verified", in: "query", schema: { type: "boolean" } },
                { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
            ],
            responses: {
                "200": {
                    description: "List of properties matching criteria.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    count: { type: "integer", example: 10 },
                                    data: { type: "array", items: { type: "object" } }
                                }
                            }
                        }
                    }
                }
            }
        },
        post: {
            tags: ["Properties"],
            summary: "Create a new property",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["property_name", "property_type"],
                            properties: {
                                property_name: { type: "string", example: "Konkan Beach Villa" },
                                property_type: { type: "string", example: "Villa" },
                                property_category: { type: "string", example: "Luxury" },
                                property_description: { type: "string", example: "Beautiful sea facing villa in Ganpatipule." },
                                check_in_time: { type: "string", example: "12:00:00" },
                                check_out_time: { type: "string", example: "10:00:00" },
                                instant_booking: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: {
                "201": { description: "Property created successfully." },
                "400": errorResponse("Validation error."),
                "401": errorResponse("Unauthorized.")
            }
        }
    },
    "/api/v1/properties/{id}": {
        get: {
            tags: ["Properties"],
            summary: "Get property details by ID or Slug",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Property ID or Slug" }],
            responses: {
                "200": { description: "Property full details including location, photos, amenities." },
                "404": errorResponse("Property not found.")
            }
        },
        put: {
            tags: ["Properties"],
            summary: "Update property details",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object" } } }
            },
            responses: {
                "200": { description: "Property updated successfully." },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Forbidden."),
                "404": errorResponse("Property not found.")
            }
        },
        delete: {
            tags: ["Properties"],
            summary: "Soft delete property",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
                "200": { description: "Property deleted successfully." },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Forbidden."),
                "404": errorResponse("Property not found.")
            }
        }
    },
    "/api/v1/properties/location/{propertyId}": {
        get: {
            tags: ["Properties"],
            summary: "Get property location / address",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
                "200": { description: "Property location details." },
                "404": errorResponse("Location not found.")
            }
        },
        post: {
            tags: ["Properties"],
            summary: "Create property location",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["address_line1"],
                            properties: {
                                address_line1: { type: "string", example: "Plot No. 42, Beach Road" },
                                city: { type: "string", example: "Ratnagiri" },
                                state: { type: "string", example: "Maharashtra" },
                                country: { type: "string", example: "India" },
                                postal_code: { type: "string", example: "415612" },
                                latitude: { type: "number", example: 17.0005 },
                                longitude: { type: "number", example: 73.3005 }
                            }
                        }
                    }
                }
            },
            responses: {
                "201": { description: "Location created." },
                "401": errorResponse("Unauthorized.")
            }
        },
        put: {
            tags: ["Properties"],
            summary: "Update property location",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object" } } }
            },
            responses: {
                "200": { description: "Location updated." },
                "401": errorResponse("Unauthorized.")
            }
        },
        delete: {
            tags: ["Properties"],
            summary: "Delete property location",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
                "200": { description: "Location deleted." },
                "401": errorResponse("Unauthorized.")
            }
        }
    }
};

module.exports = {
    propertyTags,
    propertyPaths
};
