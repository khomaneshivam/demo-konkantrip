const test = require("node:test");
const assert = require("node:assert/strict");

const {
    normalizeLocationPayload,
    validateLocationPayload
} = require("../src/controller/properties/propertyLocations");
const { isAdmin } = require("../src/middleware/requireAdmin");

test("normalizeLocationPayload keeps only writable location fields", () => {
    const location = normalizeLocationPayload({
        address_line1: "  Beach Road  ",
        city: "  Ratnagiri ",
        latitude: 17.1443,
        property_id: 99,
        delete_status: true
    });

    assert.deepEqual(location, {
        address_line1: "Beach Road",
        city: "Ratnagiri",
        latitude: 17.1443
    });
});

test("validateLocationPayload requires an address and validates coordinates", () => {
    assert.deepEqual(validateLocationPayload({}, { requireAddress: true }), ["address_line1 is required"]);
    assert.deepEqual(
        validateLocationPayload({ address_line1: "Beach Road", latitude: 91, longitude: 181 }),
        ["latitude must be between -90 and 90", "longitude must be between -180 and 180"]
    );
});

test("isAdmin recognizes administrator JWT claims", () => {
    assert.equal(isAdmin({ role: "admin" }), true);
    assert.equal(isAdmin({ role: "super_admin" }), true);
    assert.equal(isAdmin({ p_owner_id: 42 }), false);
});
