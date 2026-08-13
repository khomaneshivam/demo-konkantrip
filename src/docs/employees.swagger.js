const employeeTags = [
    { name: "Employee Authentication", description: "Authentication, session management, and profile access for employees" },
    { name: "CRM Employees", description: "Staff profiles, role assignments, and property mappings under properties" },
    { name: "CRM Roles & Permissions", description: "Role-Based Access Control (RBAC) role and permission management" }
];

const employeePaths = {
    "/api/v1/auth/employee/login": {
        post: {
            tags: ["Employee Authentication"],
            summary: "Employee login",
            description: "Authenticates an active employee and returns a JWT token containing assigned properties and permissions.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string", example: "manager@example.com" },
                                password: { type: "string", example: "Password@123" },
                                remember_me: { type: "boolean", example: false }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "Employee login successful" },
                401: { description: "Invalid credentials" },
                403: { description: "Employee account inactive/suspended" }
            }
        }
    },
    "/api/v1/auth/employee/me": {
        get: {
            tags: ["Employee Authentication"],
            summary: "Get current employee profile",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Employee profile with permissions and assigned properties" },
                401: { description: "Unauthorized" }
            }
        }
    },
    "/api/v1/auth/employee/update-password": {
        put: {
            tags: ["Employee Authentication"],
            summary: "Update employee password",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["currentPassword", "newPassword", "confirmPassword"],
                            properties: {
                                currentPassword: { type: "string", example: "OldPassword@123" },
                                newPassword: { type: "string", example: "NewPassword@123" },
                                confirmPassword: { type: "string", example: "NewPassword@123" }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "Password updated successfully" },
                400: { description: "Validation error" },
                401: { description: "Incorrect current password" }
            }
        }
    },
    "/api/v1/auth/employee/logout": {
        post: {
            tags: ["Employee Authentication"],
            summary: "Employee logout",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Logged out successfully" }
            }
        }
    },
    "/api/v1/employees": {
        get: {
            tags: ["CRM Employees"],
            summary: "List all employees",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "property_id", in: "query", schema: { type: "integer" } },
                { name: "role_id", in: "query", schema: { type: "integer" } },
                { name: "status", in: "query", schema: { type: "string", enum: ["Active", "Inactive", "Suspended", "Terminated"] } },
                { name: "search", in: "query", schema: { type: "string" } },
                { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", schema: { type: "integer", default: 50 } }
            ],
            responses: {
                200: { description: "List of employees" }
            }
        },
        post: {
            tags: ["CRM Employees"],
            summary: "Create a new employee",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["first_name", "last_name", "email", "phone", "password", "role_id"],
                            properties: {
                                first_name: { type: "string", example: "Amit" },
                                last_name: { type: "string", example: "Shinde" },
                                email: { type: "string", example: "amit.manager@hotel.com" },
                                phone: { type: "string", example: "+919876543210" },
                                password: { type: "string", example: "Secret@123" },
                                role_id: { type: "integer", example: 1 },
                                designation: { type: "string", example: "Property Manager" },
                                department: { type: "string", example: "Management" },
                                employment_type: { type: "string", enum: ["Full-Time", "Part-Time", "Contract", "Intern"], example: "Full-Time" },
                                salary: { type: "number", example: 45000 },
                                property_ids: { type: "array", items: { type: "integer" }, example: [1, 2] },
                                primary_property_id: { type: "integer", example: 1 }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "Employee created successfully" },
                400: { description: "Validation error or duplicate email/phone" }
            }
        }
    },
    "/api/v1/employees/{id}": {
        get: {
            tags: ["CRM Employees"],
            summary: "Get employee details by ID",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            responses: {
                200: { description: "Employee details" },
                404: { description: "Employee not found" }
            }
        },
        put: {
            tags: ["CRM Employees"],
            summary: "Update employee details",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                first_name: { type: "string" },
                                last_name: { type: "string" },
                                email: { type: "string" },
                                phone: { type: "string" },
                                role_id: { type: "integer" },
                                designation: { type: "string" },
                                department: { type: "string" },
                                status: { type: "string", enum: ["Active", "Inactive", "Suspended", "Terminated"] },
                                property_ids: { type: "array", items: { type: "integer" } }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "Employee updated successfully" }
            }
        },
        delete: {
            tags: ["CRM Employees"],
            summary: "Soft delete employee",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            responses: {
                200: { description: "Employee deleted successfully" }
            }
        }
    },
    "/api/v1/roles": {
        get: {
            tags: ["CRM Roles & Permissions"],
            summary: "List all system and owner custom roles",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "List of roles with permissions" }
            }
        },
        post: {
            tags: ["CRM Roles & Permissions"],
            summary: "Create a custom role with permissions",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["role_name"],
                            properties: {
                                role_name: { type: "string", example: "Night Duty Incharge" },
                                role_description: { type: "string", example: "Handles night shift operations and checkins" },
                                permission_ids: { type: "array", items: { type: "string" }, example: ["properties:read", "rooms:read", "bookings:update"] }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "Role created successfully" }
            }
        }
    },
    "/api/v1/permissions": {
        get: {
            tags: ["CRM Roles & Permissions"],
            summary: "List all system permissions grouped by module",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Available permissions" }
            }
        }
    },
    "/api/v1/properties/{propertyId}/employees": {
        get: {
            tags: ["CRM Employees"],
            summary: "List active employees assigned to a property",
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: "propertyId", in: "path", required: true, schema: { type: "integer" } }
            ],
            responses: {
                200: { description: "List of employees for property" }
            }
        }
    }
};

module.exports = {
    employeeTags,
    employeePaths
};