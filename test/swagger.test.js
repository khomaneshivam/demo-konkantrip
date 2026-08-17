const test = require("node:test");
const assert = require("node:assert/strict");
const swaggerSpec = require("../swagger");

test("Swagger: Specification is valid OpenAPI 3.0.3", () => {
    assert.equal(swaggerSpec.openapi, "3.0.3");
    assert.ok(swaggerSpec.info);
    assert.equal(swaggerSpec.info.title, "KonkanTrip Hospitality Platform API");
});

test("Swagger: All key API v1 paths are documented", () => {
    const paths = Object.keys(swaggerSpec.paths);

    // Auth paths
    assert.ok(paths.includes("/api/v1/register"));
    assert.ok(paths.includes("/api/v1/login"));
    assert.ok(paths.includes("/api/v1/login/logout"));
    assert.ok(paths.includes("/api/v1/admin/login"));
    assert.ok(paths.includes("/api/v1/health"));

    // Master Lookups
    assert.ok(paths.includes("/api/v1/lookups/master/languages"));
    assert.ok(paths.includes("/api/v1/lookups/master/document-types"));
    assert.ok(paths.includes("/api/v1/lookups/master/meal-plans"));

    // Amenity Lookups
    assert.ok(paths.includes("/api/v1/lookups/amenities"));
    assert.ok(paths.includes("/api/v1/lookups/amenities/categories"));

    // Room Lookups
    assert.ok(paths.includes("/api/v1/lookups/rooms/room-types"));
    assert.ok(paths.includes("/api/v1/lookups/rooms/bed-types"));
    assert.ok(paths.includes("/api/v1/lookups/rooms/facilities"));

    // Properties
    assert.ok(paths.includes("/api/v1/properties"));
    assert.ok(paths.includes("/api/v1/properties/{id}"));
    assert.ok(paths.includes("/api/v1/properties/location/{propertyId}"));
    assert.ok(paths.includes("/api/v1/properties/images/{propertyId}"));
    assert.ok(paths.includes("/api/v1/properties/amenities/{propertyId}"));
    assert.ok(paths.includes("/api/v1/properties/policies/{propertyId}"));

    // Rooms
    assert.ok(paths.includes("/api/v1/rooms"));
    assert.ok(paths.includes("/api/v1/rooms/{id}"));
    assert.ok(paths.includes("/api/v1/rooms/images/{roomId}"));
    assert.ok(paths.includes("/api/v1/rooms/beds/{roomId}"));
    assert.ok(paths.includes("/api/v1/rooms/amenities/{roomId}"));
    assert.ok(paths.includes("/api/v1/rooms/facilities/{roomId}"));

    // Inventory
    assert.ok(paths.includes("/api/v1/inventory/rooms"));
    assert.ok(paths.includes("/api/v1/inventory/calendar"));
    assert.ok(paths.includes("/api/v1/inventory/transactions"));
    assert.ok(paths.includes("/api/v1/inventory/blocks"));
    assert.ok(paths.includes("/api/v1/inventory/stop-sell"));
});

test("Swagger: Security scheme BearerAuth is configured", () => {
    assert.ok(swaggerSpec.components.securitySchemes.BearerAuth);
    assert.equal(swaggerSpec.components.securitySchemes.BearerAuth.scheme, "bearer");
});
