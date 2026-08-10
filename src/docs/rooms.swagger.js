const { errorResponse } = require("./schemas.swagger");

const roomTags = [
    { name: "Rooms", description: "Room management, configuration, gallery photos, beds, amenities, and room facilities." }
];

const roomPaths = {
    "/api/v1/rooms": {
        get: {
            tags: ["Rooms"],
            summary: "Search and filter rooms",
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "room_type_id", in: "query", schema: { type: "integer" } },
                { name: "room_status_id", in: "query", schema: { type: "integer" } },
                { name: "min_guests", in: "query", schema: { type: "integer" } },
                { name: "is_bookable", in: "query", schema: { type: "boolean" } },
                { name: "is_published", in: "query", schema: { type: "boolean" } },
                { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
            ],
            responses: {
                "200": {
                    description: "List of rooms matching filters.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    count: { type: "integer", example: 5 },
                                    data: { type: "array", items: { type: "object" } }
                                }
                            }
                        }
                    }
                }
            }
        },
        post: {
            tags: ["Rooms"],
            summary: "Create a new room in a property",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["property_id", "room_type_id", "room_status_id", "room_name", "room_code"],
                            properties: {
                                property_id: { type: "integer", example: 1 },
                                room_type_id: { type: "integer", example: 1 },
                                room_status_id: { type: "integer", example: 1 },
                                room_view_id: { type: "integer", example: 1 },
                                room_name: { type: "string", example: "Deluxe Sea View Suite" },
                                room_code: { type: "string", example: "DLX-101" },
                                maximum_guests: { type: "integer", example: 3 },
                                base_occupancy: { type: "integer", example: 2 },
                                air_conditioned: { type: "boolean", example: true },
                                is_bookable: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: {
                "201": { description: "Room created successfully." },
                "400": errorResponse("Validation error."),
                "401": errorResponse("Unauthorized.")
            }
        }
    },
    "/api/v1/rooms/{id}": {
        get: {
            tags: ["Rooms"],
            summary: "Get room details including beds, photos, amenities, and facilities",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
                "200": { description: "Complete room details." },
                "404": errorResponse("Room not found.")
            }
        },
        put: {
            tags: ["Rooms"],
            summary: "Update room details",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object" } } }
            },
            responses: {
                "200": { description: "Room updated successfully." },
                "401": errorResponse("Unauthorized."),
                "404": errorResponse("Room not found.")
            }
        },
        delete: {
            tags: ["Rooms"],
            summary: "Soft delete room",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
                "200": { description: "Room deleted successfully." },
                "401": errorResponse("Unauthorized."),
                "404": errorResponse("Room not found.")
            }
        }
    },
    // Room Images
    "/api/v1/rooms/{roomId}/images": {
        get: {
            tags: ["Rooms"],
            summary: "Get room photos",
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of room images." } }
        },
        post: {
            tags: ["Rooms"],
            summary: "Add photo to room gallery",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["room_image_type_id", "original_file_name", "stored_file_name", "cdn_url"],
                            properties: {
                                room_image_type_id: { type: "integer", example: 1 },
                                original_file_name: { type: "string", example: "room_bed.jpg" },
                                stored_file_name: { type: "string", example: "rooms/room_bed.jpg" },
                                cdn_url: { type: "string", example: "https://cdn.konkantrip.com/rooms/101.jpg" },
                                is_cover_image: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Room photo added." } }
        }
    },
    // Room Beds
    "/api/v1/rooms/{roomId}/beds": {
        get: {
            tags: ["Rooms"],
            summary: "Get bed configuration for room",
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of beds in room." } }
        },
        post: {
            tags: ["Rooms"],
            summary: "Add bed configuration to room",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["bed_type_id"],
                            properties: {
                                bed_type_id: { type: "integer", example: 1 },
                                quantity: { type: "integer", example: 1 },
                                bed_position: { type: "string", example: "Primary" },
                                is_default: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Bed added." } }
        }
    },
    // Room Amenities
    "/api/v1/rooms/{roomId}/amenities": {
        get: {
            tags: ["Rooms"],
            summary: "Get room-level amenities",
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of room amenities." } }
        },
        post: {
            tags: ["Rooms"],
            summary: "Add or map amenity to room",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["amenity_id"],
                            properties: {
                                amenity_id: { type: "integer", example: 1 },
                                is_available: { type: "boolean", example: true },
                                is_complimentary: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Room amenity mapped." } }
        }
    },
    // Room Facilities
    "/api/v1/rooms/{roomId}/facilities": {
        get: {
            tags: ["Rooms"],
            summary: "Get room facilities mapping",
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of room facilities." } }
        },
        post: {
            tags: ["Rooms"],
            summary: "Add or map facility to room",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "roomId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["room_facility_id"],
                            properties: {
                                room_facility_id: { type: "integer", example: 1 },
                                facility_value: { type: "string", example: "55 inch Smart LED TV" },
                                is_available: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Room facility mapped." } }
        }
    }
};

module.exports = {
    roomTags,
    roomPaths
};
