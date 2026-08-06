const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeAdminRegistrationData, buildAdminTokenPayload } = require('../src/controller/auth/adminAuth');

test('normalizeAdminRegistrationData trims and lowercases the email', () => {
  const data = normalizeAdminRegistrationData({
    first_name: '  Admin  ',
    last_name: 'User',
    phone: '9876543210',
    email: '  ADMIN@EXAMPLE.COM  ',
    password: 'secret123'
  });

  assert.equal(data.first_name, 'Admin');
  assert.equal(data.last_name, 'User');
  assert.equal(data.email, 'admin@example.com');
  assert.equal(data.password, 'secret123');
});

test('buildAdminTokenPayload includes the admin identity and role', () => {
  const payload = buildAdminTokenPayload({
    admin_id: 7,
    first_name: 'Super',
    last_name: 'Admin',
    email: 'super@example.com',
    phone: '1234567890'
  });

  assert.equal(payload.admin_id, 7);
  assert.equal(payload.role, 'admin');
  assert.equal(payload.email, 'super@example.com');
});
