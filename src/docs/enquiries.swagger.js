const { errorResponse } = require("./schemas.swagger");

const enquiryTags = [
    {
        name: "Property Enquiries & Leads",
        description: "Customer pre-booking inquiries, lead management, and status tracking"
    }
];

const enquiryPaths = {
    "/api/v1/enquiries": {
        post: {
            tags: ["Property Enquiries & Leads"],
            summary: "Submit a customer inquiry / lead for a property",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["property_id", "guest_name", "guest_mobile", "message"],
                            properties: {
                                property_id: { type: "integer", example: 1 },
                                room_id: { type: "integer", example: 1 },
                                guest_name: { type: "string", example: "Neha Deshmukh" },
                                guest_mobile: { type: "string", example: "+919822011223" },
                                guest_email: { type: "string", format: "email", example: "neha.deshmukh@example.com" },
                                check_in_date: { type: "string", format: "date", example: "2026-10-01" },
                                check_out_date: { type: "string", format: "date", example: "2026-10-04" },
                                guests_count: { type: "integer", example: 4 },
                                message: { type: "string", example: "Is pet-friendly accommodation available for 4 people with kitchen access?" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: "Enquiry submitted successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Enquiry submitted successfully" },
                                    data: { type: "object" }
                                }
                            }
                        }
                    }
                },
                400: errorResponse("Missing required fields")
            }
        },
        get: {
            tags: ["Property Enquiries & Leads"],
            summary: "List inquiries for owner / staff properties",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "status", in: "query", schema: { type: "string", enum: ["New", "Responded", "Converted", "Closed"] } },
                { name: "search", in: "query", schema: { type: "string" } },
                { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
            ],
            responses: {
                200: {
                    description: "List of property inquiries",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { type: "array", items: { type: "object" } },
                                    pagination: { type: "object" }
                                }
                            }
                        }
                    }
                },
                401: errorResponse("Authentication required")
            }
        }
    },
    "/api/v1/enquiries/{id}/status": {
        put: {
            tags: ["Property Enquiries & Leads"],
            summary: "Update enquiry status and internal notes",
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
                                status: { type: "string", enum: ["New", "Responded", "Converted", "Closed"], example: "Responded" },
                                notes: { type: "string", example: "Contacted guest on WhatsApp and confirmed pet-friendly villa availability." }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "Enquiry status updated successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Enquiry status updated successfully" },
                                    data: { type: "object" }
                                }
                            }
                        }
                    }
                },
                400: errorResponse("Invalid status value"),
                404: errorResponse("Enquiry not found")
            }
        }
    }
};

module.exports = {
    enquiryTags,
    enquiryPaths
};
