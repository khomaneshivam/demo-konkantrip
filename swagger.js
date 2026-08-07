const propertyTypes = [
    "Hotel",
    "Resort",
    "Homestay",
    "Villa",
    "Apartment",
    "Guest House",
    "Hostel",
    "Cottage",
    "Farm Stay",
    "Beach House",
    "Bungalow",
    "Tent",
    "Camping",
    "Houseboat"
];

const propertyCategories = ["Budget", "Economy", "Standard", "Premium", "Luxury", "Boutique"];
const propertyStatuses = ["Draft", "Pending", "Under Review", "Approved", "Rejected", "Suspended", "Inactive"];
const priceDisplayTypes = ["Per Night", "Per Person", "Entire Property"];

const errorResponse = (description) => ({
    description,
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
        }
    }
});

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "Hospitality API",
        version: "1.0.0",
        description: "REST API for property-owner accounts, administrators, properties, and property-owner login logs."
    },
    servers: [
        {
            url: process.env.API_BASE_URL || "http://localhost:3000",
            description: "Local development server"
        }
    ],
    tags: [
        { name: "Property owner authentication", description: "Property owner registration, login, and password management." },
        { name: "Administrator authentication", description: "Administrator registration and login." },
        { name: "Properties", description: "Property catalogue management." },
        { name: "Property locations", description: "One address/location record for each property." },
        { name: "Login logs", description: "Property-owner login audit records." },
        { name: "Administrator login logs", description: "Administrator login audit records." },
        { name: "Profile", description: "Authenticated token profile." }
    ],
    paths: {
        "/api/propertyowner/register": {
            post: {
                tags: ["Property owner authentication"],
                summary: "Register a property owner",
                operationId: "registerPropertyOwner",
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
                    "400": errorResponse("A required field is missing, or the email or phone number is already registered."),
                    "500": errorResponse("Internal server error.")
                }
            }
        },
        "/api/propertyowner/login": {
            post: {
                tags: ["Property owner authentication"],
                summary: "Log in a property owner",
                operationId: "loginPropertyOwner",
                parameters: [
                    {
                        name: "x-session-id",
                        in: "header",
                        required: false,
                        description: "Optional client session identifier saved with the login log.",
                        schema: { type: "string" }
                    },
                    {
                        name: "x-jwt-id",
                        in: "header",
                        required: false,
                        description: "Optional JWT identifier saved with the login log.",
                        schema: { type: "string" }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Login successful.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/PropertyOwnerLoginResponse" }
                            }
                        }
                    },
                    "400": errorResponse("Email or password was not supplied."),
                    "401": errorResponse("The email address or password is invalid."),
                    "500": errorResponse("Internal server error.")
                }
            }
        },
        "/api/propertyowner/update-password": {
            put: {
                tags: ["Property owner authentication"],
                summary: "Change the authenticated property owner's password",
                operationId: "updatePropertyOwnerPassword",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdatePasswordRequest" }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Password updated successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } }
                    },
                    "400": errorResponse("The password input is invalid."),
                    "401": errorResponse("The token is missing, invalid, expired, or the current password is incorrect."),
                    "404": errorResponse("The authenticated property owner was not found."),
                    "500": errorResponse("Internal server error.")
                }
            }
        },
        "/api/admin/register": {
            post: {
                tags: ["Administrator authentication"],
                summary: "Register an administrator",
                operationId: "registerAdministrator",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AdministratorRegistration" } } }
                },
                responses: {
                    "201": {
                        description: "Administrator registered successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } }
                    },
                    "400": errorResponse("A required field is missing, or the email or phone number is already registered."),
                    "500": errorResponse("Internal server error.")
                }
            }
        },
        "/api/admin/login": {
            post: {
                tags: ["Administrator authentication"],
                summary: "Log in an administrator",
                operationId: "loginAdministrator",
                parameters: [
                    { name: "x-session-id", in: "header", required: false, description: "Optional client session identifier saved with the login log.", schema: { type: "string" } },
                    { name: "x-jwt-id", in: "header", required: false, description: "Optional JWT identifier saved with the login log.", schema: { type: "string" } }
                ],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } }
                },
                responses: {
                    "200": {
                        description: "Login successful.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AdministratorLoginResponse" } } }
                    },
                    "400": errorResponse("Email or password was not supplied."),
                    "401": errorResponse("The email address or password is invalid."),
                    "500": errorResponse("Internal server error.")
                }
            }
        },
        "/api/admin/login-logs": {
            get: {
                tags: ["Administrator login logs"],
                summary: "List administrator login logs",
                operationId: "getAdministratorLoginLogs",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Administrator login logs returned successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AdminLoginLogListResponse" } } }
                    },
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "403": errorResponse("Administrator access is required."),
                    "500": errorResponse("The login logs could not be retrieved.")
                }
            }
        },
        "/api/propertyowner/login_logs": {
            get: {
                tags: ["Login logs"],
                summary: "List property-owner login logs",
                operationId: "getPropertyOwnerLoginLogs",
                description: "Returns login logs ordered by most recently created first.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Login logs returned successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/LoginLogListResponse" } } }
                    },
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "403": errorResponse("Administrator access is required."),
                    "500": errorResponse("The login logs could not be retrieved.")
                }
            }
        },
        "/api/properties": {
            get: {
                tags: ["Properties"],
                summary: "List properties",
                operationId: "getProperties",
                parameters: [
                    { name: "page", in: "query", description: "Page number; defaults to 1.", schema: { type: "integer", minimum: 1, default: 1 } },
                    { name: "limit", in: "query", description: "Results per page; defaults to 20 and is capped at 100.", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
                    { name: "search", in: "query", description: "Searches property name, slug, and description.", schema: { type: "string" } },
                    { name: "owner_id", in: "query", description: "Filter by property-owner ID.", schema: { type: "integer", minimum: 1 } },
                    { name: "status", in: "query", description: "Filter by property status.", schema: { type: "string", enum: propertyStatuses } },
                    { name: "featured", in: "query", description: "Set to true to return featured properties only.", schema: { type: "boolean" } },
                    { name: "verified", in: "query", description: "Set to true to return verified properties only.", schema: { type: "boolean" } }
                ],
                responses: {
                    "200": {
                        description: "Properties returned successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyListResponse" } } }
                    },
                    "500": errorResponse("Properties could not be retrieved.")
                }
            },
            post: {
                tags: ["Properties"],
                summary: "Create a property",
                operationId: "createProperty",
                description: "The property owner is taken from the bearer token. The slug is generated when it is omitted.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyCreateRequest" } } }
                },
                responses: {
                    "201": {
                        description: "Property created successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyResponse" } } }
                    },
                    "400": errorResponse("The property data is invalid or incomplete."),
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "404": errorResponse("The authenticated property owner was not found."),
                    "500": errorResponse("Property creation failed.")
                }
            }
        },
        "/api/properties/{id}": {
            get: {
                tags: ["Properties"],
                summary: "Get a property by ID",
                operationId: "getPropertyById",
                parameters: [{ $ref: "#/components/parameters/PropertyId" }],
                responses: {
                    "200": {
                        description: "Property returned successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyResponse" } } }
                    },
                    "404": errorResponse("The property was not found."),
                    "500": errorResponse("The property could not be retrieved.")
                }
            },
            put: {
                tags: ["Properties"],
                summary: "Update a property",
                operationId: "updateProperty",
                description: "Only supplied writable fields are changed. Changing the name regenerates the slug when a slug is not supplied.",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/PropertyId" }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyWriteRequest" } } }
                },
                responses: {
                    "200": {
                        description: "Property updated successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyResponse" } } }
                    },
                    "400": errorResponse("No writable fields were supplied or a field is invalid."),
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "403": errorResponse("The authenticated user does not own this property."),
                    "404": errorResponse("The property was not found."),
                    "500": errorResponse("Property update failed.")
                }
            },
            delete: {
                tags: ["Properties"],
                summary: "Soft-delete a property",
                operationId: "deleteProperty",
                description: "Marks the property as deleted and changes its status to Inactive.",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/PropertyId" }],
                responses: {
                    "200": {
                        description: "Property deleted successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } }
                    },
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "403": errorResponse("The authenticated user does not own this property."),
                    "404": errorResponse("The property was not found."),
                    "500": errorResponse("Property deletion failed.")
                }
            }
        },
        "/api/properties/{propertyId}/location": {
            get: {
                tags: ["Property locations"],
                summary: "Get a property's location",
                operationId: "getPropertyLocation",
                parameters: [{ $ref: "#/components/parameters/PropertyLocationPropertyId" }],
                responses: {
                    "200": { description: "Property location returned successfully.", content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyLocationResponse" } } } },
                    "404": errorResponse("The property location was not found."),
                    "500": errorResponse("The property location could not be retrieved.")
                }
            },
            post: {
                tags: ["Property locations"],
                summary: "Create or restore a property's location",
                operationId: "createPropertyLocation",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/PropertyLocationPropertyId" }],
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyLocationCreateRequest" } } } },
                responses: {
                    "201": { description: "Property location saved successfully.", content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyLocationResponse" } } } },
                    "400": errorResponse("The location data is invalid or incomplete."),
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "403": errorResponse("The authenticated user does not own this property."),
                    "404": errorResponse("The property was not found."),
                    "500": errorResponse("The property location could not be saved.")
                }
            },
            put: {
                tags: ["Property locations"],
                summary: "Update a property's location",
                operationId: "updatePropertyLocation",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/PropertyLocationPropertyId" }],
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyLocationWriteRequest" } } } },
                responses: {
                    "200": { description: "Property location updated successfully.", content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyLocationResponse" } } } },
                    "400": errorResponse("No location fields were supplied or a field is invalid."),
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "403": errorResponse("The authenticated user does not own this property."),
                    "404": errorResponse("The property or its location was not found."),
                    "500": errorResponse("The property location could not be updated.")
                }
            },
            delete: {
                tags: ["Property locations"],
                summary: "Soft-delete a property's location",
                operationId: "deletePropertyLocation",
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: "#/components/parameters/PropertyLocationPropertyId" }],
                responses: {
                    "200": { description: "Property location deleted successfully.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
                    "401": errorResponse("The token is missing, invalid, or expired."),
                    "403": errorResponse("The authenticated user does not own this property."),
                    "404": errorResponse("The property or its location was not found."),
                    "500": errorResponse("The property location could not be deleted.")
                }
            }
        },
        "/profile": {
            get: {
                tags: ["Profile"],
                summary: "Get the authenticated token profile",
                operationId: "getProfile",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Token profile returned successfully.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } }
                    },
                    "401": errorResponse("The token is missing, invalid, or expired.")
                }
            }
        }
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Use the token returned from a property-owner or administrator login."
            }
        },
        parameters: {
            PropertyId: {
                name: "id",
                in: "path",
                required: true,
                description: "Numeric property ID.",
                schema: { type: "integer", minimum: 1 }
            },
            PropertyLocationPropertyId: {
                name: "propertyId",
                in: "path",
                required: true,
                description: "Numeric property ID.",
                schema: { type: "integer", minimum: 1 }
            }
        },
        schemas: {
            SuccessResponse: {
                type: "object",
                required: ["success", "message"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Request completed successfully" }
                }
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "A descriptive error message" },
                    errors: { type: "array", items: { type: "string" }, example: ["property_type is invalid"] }
                }
            },
            PropertyOwnerRegistration: {
                type: "object",
                required: ["first_name", "last_name", "phone", "email", "password"],
                properties: {
                    first_name: { type: "string", example: "Asha" },
                    last_name: { type: "string", example: "Patil" },
                    phone: { type: "string", example: "9876543210" },
                    email: { type: "string", format: "email", example: "asha@example.com" },
                    password: { type: "string", format: "password", example: "secure-password" }
                }
            },
            AdministratorRegistration: {
                allOf: [{ $ref: "#/components/schemas/PropertyOwnerRegistration" }]
            },
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "asha@example.com" },
                    password: { type: "string", format: "password", example: "secure-password" }
                }
            },
            UpdatePasswordRequest: {
                type: "object",
                required: ["currentPassword", "newPassword", "confirmPassword"],
                properties: {
                    currentPassword: { type: "string", format: "password" },
                    newPassword: { type: "string", format: "password", minLength: 6 },
                    confirmPassword: { type: "string", format: "password", minLength: 6 }
                }
            },
            PropertyOwnerSummary: {
                type: "object",
                properties: {
                    p_owner_id: { type: "integer", example: 42 },
                    first_name: { type: "string", example: "Asha" },
                    last_name: { type: "string", example: "Patil" },
                    email: { type: "string", format: "email", example: "asha@example.com" },
                    phone: { type: "string", example: "9876543210" }
                }
            },
            AdministratorSummary: {
                type: "object",
                properties: {
                    admin_id: { type: "integer", example: 1 },
                    first_name: { type: "string", example: "Asha" },
                    last_name: { type: "string", example: "Patil" },
                    email: { type: "string", format: "email", example: "asha@example.com" },
                    phone: { type: "string", example: "9876543210" }
                }
            },
            PropertyOwnerLoginResponse: {
                type: "object",
                required: ["success", "message", "token", "user"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    token: { type: "string", description: "JWT bearer token." },
                    user: { $ref: "#/components/schemas/PropertyOwnerSummary" }
                }
            },
            AdministratorLoginResponse: {
                type: "object",
                required: ["success", "message", "token", "user"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Admin login successful" },
                    token: { type: "string", description: "JWT bearer token." },
                    user: { $ref: "#/components/schemas/AdministratorSummary" }
                }
            },
            PropertyWriteRequest: {
                type: "object",
                properties: {
                    property_name: { type: "string", example: "Konkan Beach Resort" },
                    property_slug: { type: "string", example: "konkan-beach-resort", description: "Optional; generated from property_name if omitted." },
                    property_type: { type: "string", enum: propertyTypes, example: "Resort" },
                    property_category: { type: "string", enum: propertyCategories, example: "Premium" },
                    property_description: { type: "string", example: "A peaceful beach-side resort." },
                    short_description: { type: "string", example: "Beach-side resort" },
                    star_rating: { type: "number", minimum: 0, maximum: 5, example: 4 },
                    check_in_time: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$", example: "12:00:00" },
                    check_out_time: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$", example: "10:00:00" },
                    total_rooms: { type: "integer", minimum: 0, example: 24 },
                    total_floors: { type: "integer", minimum: 0, example: 2 },
                    built_year: { type: "integer", example: 2020 },
                    renovated_year: { type: "integer", example: 2025 },
                    currency_code: { type: "string", example: "INR" },
                    price_display_type: { type: "string", enum: priceDisplayTypes, example: "Per Night" },
                    instant_booking: { type: "boolean", example: true }
                }
            },
            PropertyCreateRequest: {
                allOf: [
                    { $ref: "#/components/schemas/PropertyWriteRequest" },
                    {
                        type: "object",
                        required: ["property_name", "property_type"]
                    }
                ]
            },
            Property: {
                allOf: [
                    { $ref: "#/components/schemas/PropertyCreateRequest" },
                    {
                        type: "object",
                        properties: {
                            property_id: { type: "integer", example: 101 },
                            property_uuid: { type: "string", format: "uuid" },
                            p_owner_id: { type: "integer", example: 42 },
                            average_rating: { type: "number", example: 4.5 },
                            total_reviews: { type: "integer", example: 18 },
                            total_bookings: { type: "integer", example: 42 },
                            total_views: { type: "integer", example: 350 },
                            is_verified: { type: "boolean", example: false },
                            is_featured: { type: "boolean", example: false },
                            property_status: { type: "string", enum: propertyStatuses, example: "Draft" },
                            approval_remarks: { type: "string", nullable: true },
                            approved_by: { type: "integer", nullable: true },
                            approved_at: { type: "string", format: "date-time", nullable: true },
                            created_by: { type: "integer" },
                            updated_by: { type: "integer" },
                            delete_status: { type: "boolean", example: false },
                            created_at: { type: "string", format: "date-time" },
                            updated_at: { type: "string", format: "date-time" },
                            deleted_at: { type: "string", format: "date-time", nullable: true }
                        }
                    }
                ]
            },
            Pagination: {
                type: "object",
                properties: {
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 20 },
                    total: { type: "integer", example: 42 },
                    totalPages: { type: "integer", example: 3 }
                }
            },
            PropertyResponse: {
                type: "object",
                required: ["success", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Property created successfully" },
                    data: { $ref: "#/components/schemas/Property" }
                }
            },
            PropertyListResponse: {
                type: "object",
                required: ["success", "count", "pagination", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer", example: 20 },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Property" } }
                }
            },
            PropertyLocationWriteRequest: {
                type: "object",
                properties: {
                    address_line1: { type: "string", example: "Beach Road" },
                    address_line2: { type: "string", example: "Near the lighthouse" },
                    landmark: { type: "string", example: "Ganpatipule Beach" },
                    village: { type: "string", example: "Ganpatipule" },
                    taluka: { type: "string", example: "Ratnagiri" },
                    district: { type: "string", example: "Ratnagiri" },
                    city: { type: "string", example: "Ratnagiri" },
                    state: { type: "string", example: "Maharashtra" },
                    country: { type: "string", default: "India" },
                    postal_code: { type: "string", example: "415615" },
                    latitude: { type: "number", minimum: -90, maximum: 90, example: 17.1443 },
                    longitude: { type: "number", minimum: -180, maximum: 180, example: 73.2667 },
                    google_place_id: { type: "string" },
                    google_map_url: { type: "string", format: "uri" },
                    plus_code: { type: "string" },
                    geohash: { type: "string" },
                    timezone: { type: "string", default: "Asia/Kolkata" }
                }
            },
            PropertyLocationCreateRequest: {
                allOf: [
                    { $ref: "#/components/schemas/PropertyLocationWriteRequest" },
                    { type: "object", required: ["address_line1"] }
                ]
            },
            PropertyLocation: {
                allOf: [
                    { $ref: "#/components/schemas/PropertyLocationCreateRequest" },
                    {
                        type: "object",
                        properties: {
                            location_id: { type: "integer", example: 1 },
                            location_uuid: { type: "string", format: "uuid" },
                            property_id: { type: "integer", example: 101 },
                            delete_status: { type: "boolean", example: false },
                            created_by: { type: "integer", nullable: true },
                            updated_by: { type: "integer", nullable: true },
                            deleted_by: { type: "integer", nullable: true },
                            created_at: { type: "string", format: "date-time" },
                            updated_at: { type: "string", format: "date-time" },
                            deleted_at: { type: "string", format: "date-time", nullable: true }
                        }
                    }
                ]
            },
            PropertyLocationResponse: {
                type: "object",
                required: ["success", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Property location saved successfully" },
                    data: { $ref: "#/components/schemas/PropertyLocation" }
                }
            },
            LoginLog: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    p_owner_id: { type: "integer", nullable: true, example: 42 },
                    email: { type: "string", format: "email", nullable: true },
                    login_status: { type: "string", enum: ["SUCCESS", "FAILED"] },
                    failure_reason: { type: "string", nullable: true },
                    ip_address: { type: "string", nullable: true },
                    user_agent: { type: "string", nullable: true },
                    device_type: { type: "string", nullable: true },
                    browser: { type: "string", nullable: true },
                    operating_system: { type: "string", nullable: true },
                    login_time: { type: "string", format: "date-time" },
                    logout_time: { type: "string", format: "date-time", nullable: true },
                    session_id: { type: "string", nullable: true },
                    jwt_id: { type: "string", nullable: true },
                    created_at: { type: "string", format: "date-time" }
                }
            },
            LoginLogListResponse: {
                type: "object",
                required: ["success", "count", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer", example: 4 },
                    data: { type: "array", items: { $ref: "#/components/schemas/LoginLog" } }
                }
            },
            AdminLoginLog: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    admin_id: { type: "integer", nullable: true, example: 1 },
                    email: { type: "string", format: "email", nullable: true },
                    login_status: { type: "string", enum: ["SUCCESS", "FAILED"] },
                    failure_reason: { type: "string", nullable: true },
                    ip_address: { type: "string", nullable: true },
                    user_agent: { type: "string", nullable: true },
                    device_type: { type: "string", nullable: true },
                    browser: { type: "string", nullable: true },
                    operating_system: { type: "string", nullable: true },
                    login_time: { type: "string", format: "date-time" },
                    logout_time: { type: "string", format: "date-time", nullable: true },
                    session_id: { type: "string", nullable: true },
                    jwt_id: { type: "string", nullable: true },
                    created_at: { type: "string", format: "date-time" }
                }
            },
            AdminLoginLogListResponse: {
                type: "object",
                required: ["success", "count", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer", example: 4 },
                    data: { type: "array", items: { $ref: "#/components/schemas/AdminLoginLog" } }
                }
            },
            ProfileResponse: {
                type: "object",
                required: ["success", "data"],
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "object",
                        description: "Claims decoded from the supplied JWT.",
                        additionalProperties: true
                    }
                }
            }
        }
    }
};

module.exports = swaggerSpec;
