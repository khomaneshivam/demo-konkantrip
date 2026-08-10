const { errorResponse } = require("./schemas.swagger");

const propertySubResourceTags = [
    { name: "Property Sub-Resources", description: "Property child entities: contacts, images, amenities, highlights, tags, policies, house rules, nearby places, statistics, compliance documents, and languages." }
];

const propertySubResourcePaths = {
    // Contacts
    "/api/v1/properties/{propertyId}/contacts": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get property contacts",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of property contacts." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Add a contact to property",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["contact_type_id", "contact_name"],
                            properties: {
                                contact_type_id: { type: "integer", example: 1 },
                                contact_name: { type: "string", example: "Manager Ganesh" },
                                mobile_number: { type: "string", example: "+919876543210" },
                                email: { type: "string", example: "ganesh@villa.com" }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Contact added." } }
        }
    },
    // Images
    "/api/v1/properties/{propertyId}/images": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get property gallery images",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of property photos." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Add photo to property gallery",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["image_type_id", "cdn_url"],
                            properties: {
                                image_type_id: { type: "integer", example: 1 },
                                cdn_url: { type: "string", example: "https://cdn.konkantrip.com/properties/img1.jpg" },
                                is_cover_image: { type: "boolean", example: true }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Image added." } }
        }
    },
    // Amenities
    "/api/v1/properties/{propertyId}/amenities": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get property amenities",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of property amenities." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Set property amenities (batch replace)",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                amenities: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            amenity_id: { type: "integer", example: 1 },
                                            is_available: { type: "boolean", example: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            responses: { "200": { description: "Amenities updated." } }
        }
    },
    // Highlights
    "/api/v1/properties/{propertyId}/highlights": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get property highlights",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of property highlights." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Add highlight to property",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["highlight_title"],
                            properties: {
                                highlight_title: { type: "string", example: "Beachfront Access" },
                                highlight_description: { type: "string", example: "Direct walking path to Ganpatipule beach." }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Highlight added." } }
        }
    },
    // Policies
    "/api/v1/properties/{propertyId}/policies": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get property policies",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "Property policies and rules." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Create or update property policies",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object" } } }
            },
            responses: { "200": { description: "Policies updated." } }
        }
    },
    // House Rules
    "/api/v1/properties/{propertyId}/house-rules": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get property house rules",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of house rules." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Add a house rule",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["rule_category_id", "rule_title"],
                            properties: {
                                rule_category_id: { type: "integer", example: 1 },
                                rule_title: { type: "string", example: "Quiet hours after 10 PM" }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "House rule added." } }
        }
    },
    // Nearby Places
    "/api/v1/properties/{propertyId}/nearby-places": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get nearby tourist spots and transit",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of nearby places." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Add nearby place",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["nearby_place_type_id", "place_name", "distance"],
                            properties: {
                                nearby_place_type_id: { type: "integer", example: 1 },
                                place_name: { type: "string", example: "Ganpatipule Temple" },
                                distance: { type: "number", example: 1.5 }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Nearby place added." } }
        }
    },
    // Statistics
    "/api/v1/properties/{propertyId}/statistics": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get property traffic and booking metrics",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "Property statistics." } }
        }
    },
    "/api/v1/properties/{propertyId}/statistics/view": {
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Increment page view counter for property",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "View recorded." } }
        }
    },
    // Documents
    "/api/v1/properties/{propertyId}/documents": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get compliance documents",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of compliance documents." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Upload compliance document",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["document_type_id", "original_file_name", "stored_file_name"],
                            properties: {
                                document_type_id: { type: "integer", example: 1 },
                                document_number: { type: "string", example: "LIC-2026-98765" },
                                original_file_name: { type: "string", example: "hotel_license.pdf" },
                                stored_file_name: { type: "string", example: "docs/hotel_license_98765.pdf" }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Document uploaded." } }
        }
    },
    "/api/v1/properties/{propertyId}/documents/{documentId}/verify": {
        put: {
            tags: ["Property Sub-Resources"],
            summary: "Verify or reject compliance document (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "propertyId", in: "path", required: true, schema: { type: "integer" } },
                { name: "documentId", in: "path", required: true, schema: { type: "integer" } }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["verification_status"],
                            properties: {
                                verification_status: { type: "string", enum: ["Verified", "Rejected", "Under Review"] },
                                rejection_reason: { type: "string" },
                                verification_notes: { type: "string" }
                            }
                        }
                    }
                }
            },
            responses: { "200": { description: "Document verification status updated." } }
        }
    },
    // Languages
    "/api/v1/properties/{propertyId}/languages": {
        get: {
            tags: ["Property Sub-Resources"],
            summary: "Get languages spoken by property staff",
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            responses: { "200": { description: "List of spoken languages." } }
        },
        post: {
            tags: ["Property Sub-Resources"],
            summary: "Add spoken language to property",
            security: [{ BearerAuth: [] }],
            parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["language_id"],
                            properties: {
                                language_id: { type: "integer", example: 1 },
                                language_type: { type: "string", example: "Staff" },
                                proficiency_level: { type: "string", example: "Fluent" }
                            }
                        }
                    }
                }
            },
            responses: { "201": { description: "Language mapped." } }
        }
    }
};

module.exports = {
    propertySubResourceTags,
    propertySubResourcePaths
};
