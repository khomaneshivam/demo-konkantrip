const { errorResponse } = require("./schemas.swagger");

const authTags = [
    { name: "Property Owner Authentication", description: "Property owner registration, login, logout, and password management." },
    { name: "Administrator Authentication", description: "Administrator registration, login, logout, and activity logs." },
    { name: "System & Profile", description: "System health check and authenticated user profile." }
];

const authPaths = {
    "/api/v1/health": {
        get: {
            tags: ["System & Profile"],
            summary: "Health check",
            description: "Returns the operational status of the Hospitality API v1.",
            responses: {
                "200": {
                    description: "API is healthy and running.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "KonkanTrip Hospitality API v1 is running" },
                                    timestamp: { type: "string", example: "2026-08-10T15:25:00.000Z" }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "/api/v1/profile": {
        get: {
            tags: ["System & Profile"],
            summary: "Get current user profile",
            security: [{ BearerAuth: [] }],
            responses: {
                "200": {
                    description: "Authenticated user profile.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { type: "object" }
                                }
                            }
                        }
                    }
                },
                "401": errorResponse("Unauthorized or token expired.")
            }
        }
    },
    "/api/v1/register": {
        post: {
            tags: ["Property Owner Authentication"],
            summary: "Register a property owner",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/PropertyOwnerRegistration" }
                    }
                }
            },
            responses: {
                "201": {
                    description: "Property owner registered successfully.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SuccessResponse" }
                        }
                    }
                },
                "400": errorResponse("Validation error or duplicate email/phone."),
                "500": errorResponse("Internal server error.")
            }
        }
    },
    "/api/v1/login": {
        post: {
            tags: ["Property Owner Authentication"],
            summary: "Log in a property owner",
            parameters: [
                {
                    name: "x-session-id",
                    in: "header",
                    required: false,
                    schema: { type: "string" }
                },
                {
                    name: "x-jwt-id",
                    in: "header",
                    required: false,
                    schema: { type: "string" }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/LoginPayload" }
                    }
                }
            },
            responses: {
                "200": {
                    description: "Login successful. Returns JWT token and owner details.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Login successful" },
                                    token: { type: "string", example: "eyJhbGciOi..." },
                                    user: { type: "object" }
                                }
                            }
                        }
                    }
                },
                "400": errorResponse("Missing email or password."),
                "401": errorResponse("Invalid credentials.")
            }
        }
    },
    "/api/v1/login/logout": {
        post: {
            tags: ["Property Owner Authentication"],
            summary: "Log out property owner and invalidate token",
            security: [{ BearerAuth: [] }],
            responses: {
                "200": {
                    description: "Logged out successfully.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SuccessResponse" }
                        }
                    }
                }
            }
        }
    },
    "/api/v1/update-password": {
        post: {
            tags: ["Property Owner Authentication"],
            summary: "Update property owner password",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdatePasswordPayload" }
                    }
                }
            },
            responses: {
                "200": {
                    description: "Password updated successfully.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SuccessResponse" }
                        }
                    }
                },
                "400": errorResponse("Validation error or incorrect old password."),
                "401": errorResponse("Unauthorized.")
            }
        }
    },
    "/api/v1/property_owner_login_logs": {
        get: {
            tags: ["Property Owner Authentication"],
            summary: "Get login audit logs for the authenticated owner",
            security: [{ BearerAuth: [] }],
            parameters: [
                {
                    name: "limit",
                    in: "query",
                    required: false,
                    schema: { type: "integer", default: 10 }
                }
            ],
            responses: {
                "200": {
                    description: "List of login history records.",
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
                },
                "401": errorResponse("Unauthorized.")
            }
        }
    },
    "/api/v1/admin/register": {
        post: {
            tags: ["Administrator Authentication"],
            summary: "Register a new Administrator",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AdminRegistration" }
                    }
                }
            },
            responses: {
                "201": {
                    description: "Administrator created successfully.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SuccessResponse" }
                        }
                    }
                },
                "400": errorResponse("Validation error or duplicate admin."),
                "500": errorResponse("Internal server error.")
            }
        }
    },
    "/api/v1/admin/login": {
        post: {
            tags: ["Administrator Authentication"],
            summary: "Log in an Administrator",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/LoginPayload" }
                    }
                }
            },
            responses: {
                "200": {
                    description: "Admin login successful. Returns JWT token.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Admin login successful" },
                                    token: { type: "string", example: "eyJhbGci..." },
                                    user: { type: "object" }
                                }
                            }
                        }
                    }
                },
                "401": errorResponse("Invalid credentials.")
            }
        }
    },
    "/api/v1/admin/logout": {
        post: {
            tags: ["Administrator Authentication"],
            summary: "Log out administrator and invalidate token",
            security: [{ BearerAuth: [] }],
            responses: {
                "200": {
                    description: "Admin logged out successfully.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SuccessResponse" }
                        }
                    }
                }
            }
        }
    },
    "/api/v1/admin/login-logs": {
        get: {
            tags: ["Administrator Authentication"],
            summary: "Get administrator login activity logs",
            security: [{ BearerAuth: [] }],
            parameters: [
                {
                    name: "limit",
                    in: "query",
                    required: false,
                    schema: { type: "integer", default: 20 }
                }
            ],
            responses: {
                "200": {
                    description: "List of administrator login records.",
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
                },
                "401": errorResponse("Unauthorized."),
                "403": errorResponse("Admin access required.")
            }
        }
    }
};

module.exports = {
    authTags,
    authPaths
};
