const { errorResponse } = require("./schemas.swagger");

const amenityTags = [
    { name: "Amenity Lookups", description: "Catalogs for amenity categories and property/room amenities." }
];

const amenityPaths = {
    "/api/v1/lookups/amenities/categories": {
        get: {
            tags: ["Amenity Lookups"],
            summary: "List all amenity categories",
            responses: {
                "200": {
                    description: "List of amenity categories.",
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
            tags: ["Amenity Lookups"],
            summary: "Create amenity category (Admin only)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["category_name"],
                            properties: {
                                category_name: { type: "string", example: "Bathroom" },
                                category_icon: { type: "string", example: "fa-bath" },
                                display_order: { type: "integer", example: 1 },
                                status: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: {
                "201": { description: "Amenity category created successfully." },
                "400": errorResponse("Validation error."),
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required.")
            }
        }
    },
    "/api/v1/lookups/amenities/categories/{id}": {
        put: {
            tags: ["Amenity Lookups"],
            summary: "Update amenity category (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object" } } }
            },
            responses: {
                "200": { description: "Amenity category updated." },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required."),
                "404": errorResponse("Category not found.")
            }
        },
        delete: {
            tags: ["Amenity Lookups"],
            summary: "Delete amenity category (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
                "200": { description: "Category deleted." },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required."),
                "404": errorResponse("Category not found.")
            }
        }
    },
    "/api/v1/lookups/amenities": {
        get: {
            tags: ["Amenity Lookups"],
            summary: "List all amenities",
            parameters: [
                { name: "category_id", in: "query", schema: { type: "integer" }, description: "Filter by category ID" },
                { name: "popular_only", in: "query", schema: { type: "boolean" }, description: "Filter popular amenities only" }
            ],
            responses: {
                "200": {
                    description: "List of amenities.",
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
            tags: ["Amenity Lookups"],
            summary: "Create a new amenity (Admin only)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["amenity_category_id", "amenity_name"],
                            properties: {
                                amenity_category_id: { type: "integer", example: 1 },
                                amenity_name: { type: "string", example: "Free Wi-Fi" },
                                amenity_icon: { type: "string", example: "fa-wifi" },
                                amenity_description: { type: "string", example: "High speed wireless internet" },
                                is_popular: { type: "boolean", example: true },
                                display_order: { type: "integer", example: 1 },
                                status: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: {
                "201": { description: "Amenity created successfully." },
                "400": errorResponse("Validation error."),
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required.")
            }
        }
    },
    "/api/v1/lookups/amenities/{id}": {
        put: {
            tags: ["Amenity Lookups"],
            summary: "Update amenity (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object" } } }
            },
            responses: {
                "200": { description: "Amenity updated." },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required."),
                "404": errorResponse("Amenity not found.")
            }
        },
        delete: {
            tags: ["Amenity Lookups"],
            summary: "Delete amenity (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
                "200": { description: "Amenity deleted." },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required."),
                "404": errorResponse("Amenity not found.")
            }
        }
    }
};

module.exports = {
    amenityTags,
    amenityPaths
};
