const test = require("node:test");
const assert = require("node:assert/strict");
const {
    normalizeLocationPayload,
    validateLocationPayload
} = require("../src/controllers/properties/propertyLocations");
const { isAdmin } = require("../src/middlewares/requireAdmin");

test("normalizeLocationPayload keeps only writable location fields", () => {
    const payload = normalizeLocationPayload({
        address_line1: "  Beach Road 12  ",
        address_line2: "  Near Temple  ",
        city: " Ratnagiri ",
        state: " Maharashtra ",
        country: " India ",
        postal_code: " 415612 ",
        latitude: "16.9902",
        longitude: "73.3120",
        google_map_url: " https://maps.google.com/?q=16.9902,73.3120 ",
        unknown_field: "drop me"
    });

    assert.equal(payload.address_line1, "Beach Road 12");
    assert.equal(payload.address_line2, "Near Temple");
    assert.equal(payload.city, "Ratnagiri");
    assert.equal(payload.state, "Maharashtra");
    assert.equal(payload.country, "India");
    assert.equal(payload.postal_code, "415612");
    assert.equal(payload.latitude, "16.9902");
    assert.equal(payload.longitude, "73.3120");
    assert.equal(payload.google_map_url, "https://maps.google.com/?q=16.9902,73.3120");
    assert.equal(payload.unknown_field, undefined);
});

test("validateLocationPayload requires an address and validates coordinates", () => {
    const missingAddressErrors = validateLocationPayload({}, { requireAddress: true });
    assert.equal(missingAddressErrors.length > 0, true);
    assert.equal(missingAddressErrors.includes("address_line1 is required"), true);

    const invalidLatErrors = validateLocationPayload({
        address_line1: "Main Road",
        latitude: 95
    });
    assert.equal(invalidLatErrors.length > 0, true);
    assert.equal(invalidLatErrors.includes("latitude must be between -90 and 90"), true);

    const validErrors = validateLocationPayload({
        address_line1: "Main Road",
        latitude: 17.0,
        longitude: 73.0
    });
    assert.equal(validErrors.length, 0);
});

test("isAdmin recognizes administrator JWT claims", () => {
    assert.equal(isAdmin({ role: "admin" }), true);
    assert.equal(isAdmin({ role: "super_admin" }), true);
    assert.equal(isAdmin({ is_admin: true }), true);
    assert.equal(isAdmin({ role: "property_owner" }), false);
    assert.equal(isAdmin({}), false);
});
