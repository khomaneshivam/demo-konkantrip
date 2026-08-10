const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAdminRegistrationData, buildAdminTokenPayload } = require('../src/controllers/auth/adminAuth');

test('normalizeAdminRegistrationData trims and lowercases the email', () => {
    const input = {
        first_name: ' Super ',
        last_name: ' Admin ',
        email: ' Admin@KonkanTrip.Com ',
        phone: ' 9876543210 ',
        password: ' SecretPassword! '
    };

    const normalized = normalizeAdminRegistrationData(input);

    assert.equal(normalized.first_name, 'Super');
    assert.equal(normalized.last_name, 'Admin');
    assert.equal(normalized.email, 'admin@konkantrip.com');
    assert.equal(normalized.phone, '9876543210');
    assert.equal(normalized.password, ' SecretPassword! ');
});

test('buildAdminTokenPayload includes the admin identity and role', () => {
    const payload = buildAdminTokenPayload({
        admin_id: 42,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '9876543210'
    });

    assert.deepEqual(payload, {
        admin_id: 42,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '9876543210',
        role: 'admin'
    });
});
