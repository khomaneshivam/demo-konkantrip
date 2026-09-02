const { errorResponse } = require("./schemas.swagger");

const customerAuthTags = [
    {
        name: "Customer Verification & OTP",
        description: "Mobile & Email OTP request, verification, and guest session management"
    }
];

const customerAuthPaths = {
    "/api/v1/customer/request-otp": {
        post: {
            tags: ["Customer Verification & OTP"],
            summary: "Request a 6-digit OTP code via Mobile (WhatsApp/SMS) or Email",
            description: "Generates a secure, 5-minute validity OTP. In non-production/test environments, the OTP is also returned as `dev_otp` in the response for instantaneous Swagger UI testing.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["identifier"],
                            properties: {
                                identifier: {
                                    type: "string",
                                    example: "customer@example.com",
                                    description: "Mobile number (+919876543210) or Email address"
                                },
                                otp_type: {
                                    type: "string",
                                    enum: ["Mobile", "Email"],
                                    example: "Email",
                                    description: "Type of channel to dispatch OTP"
                                },
                                purpose: {
                                    type: "string",
                                    example: "Booking Verification",
                                    description: "Verification context"
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "OTP generated and dispatched successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "OTP sent successfully to customer@example.com" },
                                    data: {
                                        type: "object",
                                        properties: {
                                            identifier: { type: "string", example: "customer@example.com" },
                                            otp_type: { type: "string", example: "Email" },
                                            expires_in_seconds: { type: "integer", example: 300 },
                                            dev_otp: { type: "string", example: "492817", description: "Convenience preview code for instant Swagger testing" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                400: errorResponse("Invalid input or missing identifier"),
                429: errorResponse("Rate limit exceeded")
            }
        }
    },
    "/api/v1/customer/verify-otp": {
        post: {
            tags: ["Customer Verification & OTP"],
            summary: "Verify OTP code and receive authenticated Customer JWT",
            description: "Verifies the entered OTP code against the SHA-256 hash. Upon successful verification, creates/updates the customer record and returns a signed 7-day JWT token.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["identifier", "otp"],
                            properties: {
                                identifier: {
                                    type: "string",
                                    example: "customer@example.com",
                                    description: "Mobile number or Email address used when requesting OTP"
                                },
                                otp: {
                                    type: "string",
                                    example: "492817",
                                    description: "6-digit OTP code"
                                },
                                full_name: {
                                    type: "string",
                                    example: "Aarav Sharma",
                                    description: "Customer full name (optional, defaults to Guest)"
                                },
                                mobile_number: {
                                    type: "string",
                                    example: "+919876543210",
                                    description: "Customer phone number (if verified via email)"
                                },
                                email: {
                                    type: "string",
                                    example: "customer@example.com",
                                    description: "Customer email address"
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "OTP verified and authenticated customer session created",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "OTP verified successfully" },
                                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                                    data: {
                                        type: "object",
                                        properties: {
                                            customer_id: { type: "integer", example: 1 },
                                            customer_uuid: { type: "string", example: "d9e4a8b2-..." },
                                            full_name: { type: "string", example: "Aarav Sharma" },
                                            mobile_number: { type: "string", example: "+919876543210" },
                                            email: { type: "string", example: "customer@example.com" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                400: errorResponse("Invalid or expired OTP"),
                429: errorResponse("Too many failed verification attempts")
            }
        }
    },
    "/api/v1/customer/me": {
        get: {
            tags: ["Customer Verification & OTP"],
            summary: "Get currently authenticated customer profile and booking history",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "Customer profile and reservation history retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "object",
                                        properties: {
                                            profile: { type: "object" },
                                            bookings: { type: "array", items: { type: "object" } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                401: errorResponse("Unauthorized or invalid customer token")
            }
        }
    }
};

module.exports = {
    customerAuthTags,
    customerAuthPaths
};
