const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildPropertySlug,
    normalizePropertyPayload,
    resolvePropertyOwnerId,
    sanitizePropertyPayloadForRole
} = require('../src/controllers/properties/properties');

test('buildPropertySlug generates a readable slug from the property name', async () => {
    const slug = await buildPropertySlug(' Konkan Beach Resort & Spa ');
    assert.equal(slug, 'konkan-beach-resort-spa');
});

test('normalizePropertyPayload trims and preserves allowed fields', async () => {
    const payload = await normalizePropertyPayload({
        property_name: ' Ocean Breeze Villa ',
        property_type: ' Villa ',
        property_category: ' Luxury ',
        property_description: ' A luxury beachfront villa with sunset views. ',
        extra_unknown_field: 'drop me'
    });

    assert.equal(payload.property_name, 'Ocean Breeze Villa');
    assert.equal(payload.property_type, 'Villa');
    assert.equal(payload.property_category, 'Luxury');
    assert.equal(payload.property_description, 'A luxury beachfront villa with sunset views.');
    assert.equal(payload.extra_unknown_field, undefined);
});

test('resolvePropertyOwnerId uses the authenticated owner id from the token', () => {
    const ownerId = resolvePropertyOwnerId({
        user: { p_owner_id: 11, role: 'property_owner' },
        body: { p_owner_id: 99 }
    });

    assert.equal(ownerId, 11);
});

test('normalizePropertyPayload drops the removed starting_price field', async () => {
    const payload = await normalizePropertyPayload({
        property_name: ' Konkan Nest ',
        property_type: ' Homestay ',
        starting_price: 3499.00
    });

    assert.equal(payload.property_name, 'Konkan Nest');
    assert.equal(payload.starting_price, undefined);
});

test('sanitizePropertyPayloadForRole blocks admin-only fields for non-super-admins', () => {
    const sanitized = sanitizePropertyPayloadForRole(
        {
            property_name: 'Konkan Pearl Resort',
            is_featured: true,
            property_status: 'Approved'
        },
        { user: { role: 'admin', is_super_admin: false } }
    );

    assert.equal(sanitized.property_name, 'Konkan Pearl Resort');
    assert.equal(sanitized.is_featured, undefined);
    assert.equal(sanitized.property_status, undefined);
});

test('sanitizePropertyPayloadForRole enables featured when a super-admin approves the property', () => {
    const sanitized = sanitizePropertyPayloadForRole(
        {
            property_name: 'Konkan Pearl Resort',
            is_featured: true,
            property_status: 'Approved'
        },
        { user: { role: 'admin', is_super_admin: true } }
    );

    assert.equal(sanitized.property_name, 'Konkan Pearl Resort');
    assert.equal(sanitized.is_featured, true);
    assert.equal(sanitized.property_status, 'Approved');
});
