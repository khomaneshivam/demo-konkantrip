const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPropertySlug, normalizePropertyPayload, resolvePropertyOwnerId, sanitizePropertyPayloadForRole } = require('../src/controller/properties/properties');

test('buildPropertySlug generates a readable slug from the property name', async () => {
  const slug = await buildPropertySlug('Ocean View Resort');
  assert.equal(slug, 'ocean-view-resort');
});

test('normalizePropertyPayload trims and preserves allowed fields', async () => {
  const payload = await normalizePropertyPayload({
    property_name: '  Beach House  ',
    property_type: 'Beach House',
    property_status: 'Draft',
    unexpected: 'value'
  });

  assert.equal(payload.property_name, 'Beach House');
  assert.equal(payload.property_type, 'Beach House');
  assert.equal(payload.property_status, 'Draft');
  assert.equal(payload.unexpected, undefined);
});

test('resolvePropertyOwnerId uses the authenticated owner id from the token', async () => {
  const req = {
    user: { p_owner_id: 42 },
    body: { p_owner_id: 99 }
  };

  const ownerId = resolvePropertyOwnerId(req);
  assert.equal(ownerId, 42);
});

test('normalizePropertyPayload drops the removed starting_price field', async () => {
  const payload = await normalizePropertyPayload({
    property_name: 'Beach House',
    starting_price: 1500
  });

  assert.equal(payload.starting_price, undefined);
});

test('sanitizePropertyPayloadForRole blocks admin-only fields for non-super-admins', async () => {
  const payload = {
    property_name: 'Beach House',
    is_verified: true,
    is_featured: true,
    approval_remarks: 'Approved',
    approved_by: 1,
    approved_at: '2026-08-05T00:00:00.000Z'
  };

  const sanitized = sanitizePropertyPayloadForRole(payload, { user: { p_owner_id: 10 } });

  assert.equal(sanitized.is_verified, undefined);
  assert.equal(sanitized.is_featured, undefined);
  assert.equal(sanitized.approval_remarks, undefined);
  assert.equal(sanitized.approved_by, undefined);
  assert.equal(sanitized.approved_at, undefined);
});

test('sanitizePropertyPayloadForRole enables featured when a super-admin approves the property', async () => {
  const payload = {
    property_status: 'Approved',
    is_featured: false
  };

  const sanitized = sanitizePropertyPayloadForRole(payload, { user: { role: 'SUPER_ADMIN' } });

  assert.equal(sanitized.property_status, 'Approved');
  assert.equal(sanitized.is_featured, true);
});
