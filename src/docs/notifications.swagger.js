const { errorResponse } = require("./schemas.swagger");

const notificationTags = [
    {
        name: "Notifications & WhatsApp Webhooks",
        description: "Email SMTP test delivery, message queue logs, and WhatsApp delivery webhooks"
    }
];

const notificationPaths = {
    "/api/v1/notifications/test-email": {
        post: {
            tags: ["Notifications & WhatsApp Webhooks"],
            summary: "Test Email SMTP Dispatch via Swagger UI",
            description: "Sends a test email to the specified recipient using configured SMTP or development logger.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["to_email"],
                            properties: {
                                to_email: { type: "string", format: "email", example: "test@example.com" },
                                subject: { type: "string", example: "KonkanTrip Test Notification" },
                                message: { type: "string", example: "Testing free email notification integration from Swagger UI." }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "Email dispatched successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Email dispatched successfully to test@example.com" },
                                    data: { type: "object" }
                                }
                            }
                        }
                    }
                },
                400: errorResponse("Missing recipient email"),
                500: errorResponse("Failed to send email")
            }
        }
    },
    "/api/v1/notifications/logs": {
        get: {
            tags: ["Notifications & WhatsApp Webhooks"],
            summary: "List outbound notification queue messages & provider delivery states",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "booking_id", in: "query", schema: { type: "integer" } },
                { name: "limit", in: "query", schema: { type: "integer", default: 50 } }
            ],
            responses: {
                200: {
                    description: "List of notification records with delivery status",
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
        }
    },
    "/api/v1/webhooks/whatsapp": {
        post: {
            tags: ["Notifications & WhatsApp Webhooks"],
            summary: "WhatsApp Delivery Status Callback Webhook",
            description: "Receives sent, delivered, read, and failed status updates from WhatsApp provider (Meta Cloud API / simulator).",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                provider_message_id: { type: "string", example: "wa_msg_987162534" },
                                status: { type: "string", enum: ["SENT", "DELIVERED", "READ", "FAILED"], example: "DELIVERED" }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "Webhook processed successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Webhook processed successfully" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = {
    notificationTags,
    notificationPaths
};
