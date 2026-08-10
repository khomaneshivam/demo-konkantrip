/**
 * Common OpenAPI Schemas and Security Schemes
 */

const commonSchemas = {
    SuccessResponse: {
        type: "object",
        properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
            data: { type: "object" }
        }
    },
    ErrorResponse: {
        type: "object",
        properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message description" }
        }
    },
    PropertyOwnerRegistration: {
        type: "object",
        required: ["first_name", "last_name", "phone", "email", "password"],
        properties: {
            first_name: { type: "string", example: "Ramesh" },
            last_name: { type: "string", example: "Patil" },
            phone: { type: "string", example: "+919876543210" },
            email: { type: "string", format: "email", example: "ramesh.patil@example.com" },
            password: { type: "string", format: "password", example: "Secret@123" }
        }
    },
    AdminRegistration: {
        type: "object",
        required: ["first_name", "last_name", "phone", "email", "password"],
        properties: {
            first_name: { type: "string", example: "Super" },
            last_name: { type: "string", example: "Admin" },
            phone: { type: "string", example: "+919999999999" },
            email: { type: "string", format: "email", example: "admin@konkantrip.com" },
            password: { type: "string", format: "password", example: "Admin@2026" }
        }
    },
    LoginPayload: {
        type: "object",
        required: ["email", "password"],
        properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", format: "password", example: "Password@123" }
        }
    },
    UpdatePasswordPayload: {
        type: "object",
        required: ["old_password", "new_password"],
        properties: {
            old_password: { type: "string", format: "password", example: "OldSecret@123" },
            new_password: { type: "string", format: "password", example: "NewSecret@456" }
        }
    }
};

const securitySchemes = {
    BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer JWT token obtained from login."
    }
};

const errorResponse = (description) => ({
    description,
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
        }
    }
});

const successResponse = (description, schemaRef = "#/components/schemas/SuccessResponse") => ({
    description,
    content: {
        "application/json": {
            schema: { $ref: schemaRef }
        }
    }
});

module.exports = {
    commonSchemas,
    securitySchemes,
    errorResponse,
    successResponse
};
