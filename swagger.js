/**
 * Master Swagger / OpenAPI 3.0.3 Specification
 * Aggregates all modular route documentation files from src/docs/
 */

const { commonSchemas, securitySchemes } = require("./src/docs/schemas.swagger");
const { authTags, authPaths } = require("./src/docs/auth.swagger");
const { masterLookupTags, masterLookupPaths } = require("./src/docs/masterLookups.swagger");
const { amenityTags, amenityPaths } = require("./src/docs/amenities.swagger");
const { roomLookupTags, roomLookupPaths } = require("./src/docs/roomLookups.swagger");
const { propertyTags, propertyPaths } = require("./src/docs/properties.swagger");
const { propertySubResourceTags, propertySubResourcePaths } = require("./src/docs/propertySubResources.swagger");
const { roomTags, roomPaths } = require("./src/docs/rooms.swagger");
const { inventoryTags, inventoryPaths } = require("./src/docs/inventory.swagger");
const { adminDashboardTags, adminDashboardPaths } = require("./src/docs/adminDashboard.swagger");
const uploadSwagger = require("./src/docs/upload.swagger");

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "KonkanTrip Hospitality Platform API",
        version: "1.0.0",
        description: "Comprehensive REST API documentation for the KonkanTrip Hospitality Management System, covering Owners, Administrators, Lookups, Properties, Sub-resources, Rooms, Inventory, Direct File Uploads, and Booking Controls."
    },
    servers: [
        {
            url: process.env.API_BASE_URL || "http://localhost:3000",
            description: "Local development server"
        }
    ],
    tags: [
        ...authTags,
        ...masterLookupTags,
        ...amenityTags,
        ...roomLookupTags,
        ...propertyTags,
        ...propertySubResourceTags,
        ...roomTags,
        ...inventoryTags,
        ...adminDashboardTags,
        { name: "File Uploads", description: "Direct file upload, media storage and instant asset linking endpoints" }
    ],
    paths: {
        ...authPaths,
        ...masterLookupPaths,
        ...amenityPaths,
        ...roomLookupPaths,
        ...propertyPaths,
        ...propertySubResourcePaths,
        ...roomPaths,
        ...inventoryPaths,
        ...adminDashboardPaths,
        ...uploadSwagger.paths
    },
    components: {
        securitySchemes,
        schemas: {
            ...commonSchemas
        }
    }
};

module.exports = swaggerSpec;
