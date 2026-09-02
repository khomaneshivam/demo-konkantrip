const { errorResponse } = require("./schemas.swagger");

const bookingTags = [
    {
        name: "OTA Bookings & Reservations",
        description: "Phase 1 OTA booking creation with atomic inventory checks, WhatsApp/Email notifications, and status lifecycle"
    }
];

const bookingPaths = {
    "/api/v1/bookings": {
        post: {
            tags: ["OTA Bookings & Reservations"],
            summary: "Create a confirmed booking with atomic inventory reservation",
            description: "Atomically verifies room availability across all stay dates, locks & reserves inventory, inserts booking ledger records, and enqueues WhatsApp & Email notifications.",
            parameters: [
                {
                    name: "Idempotency-Key",
                    in: "header",
                    required: false,
                    description: "Unique client idempotency token to prevent double-booking submissions",
                    schema: { type: "string", example: "idemp-req-98817263" }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["property_id", "room_id", "check_in_date", "check_out_date", "guest_name", "guest_mobile"],
                            properties: {
                                property_id: { type: "integer", example: 1, description: "Target property ID" },
                                room_id: { type: "integer", example: 1, description: "Target room ID" },
                                check_in_date: { type: "string", format: "date", example: "2026-09-10" },
                                check_out_date: { type: "string", format: "date", example: "2026-09-12" },
                                total_guests: { type: "integer", example: 2 },
                                adults: { type: "integer", example: 2 },
                                children: { type: "integer", example: 0 },
                                guest_name: { type: "string", example: "Aarav Sharma" },
                                guest_mobile: { type: "string", example: "+919876543210" },
                                guest_email: { type: "string", format: "email", example: "aarav.sharma@example.com" },
                                special_requests: { type: "string", example: "Ground floor room preferred" },
                                quantity: { type: "integer", example: 1, description: "Number of room units to book" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: "Booking created and confirmed successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Booking created and confirmed successfully" },
                                    data: {
                                        type: "object",
                                        properties: {
                                            booking: { type: "object" },
                                            rooms: { type: "array", items: { type: "object" } },
                                            property: { type: "object" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                400: errorResponse("Invalid dates or missing booking parameters"),
                404: errorResponse("Property or room not found"),
                409: errorResponse("Room is sold out or unavailable on selected dates")
            }
        },
        get: {
            tags: ["OTA Bookings & Reservations"],
            summary: "List bookings (Customer, Property Owner, Staff, Admin)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "status", in: "query", schema: { type: "string", enum: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] } },
                { name: "from_date", in: "query", schema: { type: "string", format: "date" } },
                { name: "to_date", in: "query", schema: { type: "string", format: "date" } },
                { name: "search", in: "query", schema: { type: "string" } },
                { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
            ],
            responses: {
                200: {
                    description: "Paginated list of bookings",
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
    "/api/v1/bookings/{idOrUuid}": {
        get: {
            tags: ["OTA Bookings & Reservations"],
            summary: "Get booking details by ID, UUID, or Booking Number",
            security: [{ BearerAuth: [] }],
            parameters: [
                {
                    name: "idOrUuid",
                    in: "path",
                    required: true,
                    description: "Booking ID, UUID, or Booking Number (e.g. KT-20260831-ABCD)",
                    schema: { type: "string", example: "1" }
                }
            ],
            responses: {
                200: {
                    description: "Booking details with room breakdown, status history, and property front desk contacts",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "object",
                                        properties: {
                                            booking_id: { type: "integer", example: 1 },
                                            booking_number: { type: "string", example: "KT-20260831-7890" },
                                            booking_status: { type: "string", example: "CONFIRMED" },
                                            rooms: { type: "array", items: { type: "object" } },
                                            history: { type: "array", items: { type: "object" } },
                                            property_contact: { type: "object" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                404: errorResponse("Booking not found")
            }
        }
    },
    "/api/v1/bookings/{idOrUuid}/status": {
        put: {
            tags: ["OTA Bookings & Reservations"],
            summary: "Update booking status (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)",
            description: "When updating to `CANCELLED`, automatically releases inventory back to `inventory_calendar` and dispatches cancellation alerts.",
            security: [{ BearerAuth: [] }],
            parameters: [
                {
                    name: "idOrUuid",
                    in: "path",
                    required: true,
                    schema: { type: "string", example: "1" }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["status"],
                            properties: {
                                status: {
                                    type: "string",
                                    enum: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"],
                                    example: "CANCELLED"
                                },
                                reason: {
                                    type: "string",
                                    example: "Customer requested cancellation due to travel plan change"
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "Booking status updated successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Booking cancelled and room inventory released successfully" },
                                    data: { type: "object" }
                                }
                            }
                        }
                    }
                },
                400: errorResponse("Invalid status value"),
                404: errorResponse("Booking not found")
            }
        }
    }
};

module.exports = {
    bookingTags,
    bookingPaths
};
