const { errorResponse } = require("./schemas.swagger");

const masterLookupTags = [
    { name: "Master Lookups", description: "Master catalogs for languages, document types, place types, rule categories, tags, images, contacts, certifications, and meal plans." }
];

const createLookupSwaggerPaths = (basePath, entityName) => {
    return {
        [`/api/v1/lookups/master/${basePath}`]: {
            get: {
                tags: ["Master Lookups"],
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
                tags: ["Master Lookups"],
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
        [`/api/v1/lookups/master/${basePath}/{id}`]: {
            get: {
                tags: ["Master Lookups"],
                summary: `Get ${entityName} by ID`,
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: {
                    "200": { description: `${entityName} details.` },
                    "404": errorResponse(`${entityName} not found.`)
                }
            },
            put: {
                tags: ["Master Lookups"],
                summary: `Update ${entityName} (Admin only)`,
                security: [{ BearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { type: "object" } } }
                },
                responses: {
                    "200": { description: `${entityName} updated successfully.` },
                    "401": errorResponse("Unauthorized."),
                    "403": errorResponse("Admin access required."),
                    "404": errorResponse(`${entityName} not found.`)
                }
            },
            delete: {
                tags: ["Master Lookups"],
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

const masterLookupPaths = {
    ...createLookupSwaggerPaths("languages", "Language"),
    ...createLookupSwaggerPaths("document-types", "Document Type"),
    ...createLookupSwaggerPaths("nearby-place-types", "Nearby Place Type"),
    ...createLookupSwaggerPaths("house-rule-categories", "House Rule Category"),
    ...createLookupSwaggerPaths("tags", "Tag"),
    ...createLookupSwaggerPaths("property-image-types", "Property Image Type"),
    ...createLookupSwaggerPaths("contact-types", "Contact Type"),
    ...createLookupSwaggerPaths("certification-types", "Certification Type"),
    ...createLookupSwaggerPaths("meal-plans", "Meal Plan")
};

module.exports = {
    masterLookupTags,
    masterLookupPaths
};
