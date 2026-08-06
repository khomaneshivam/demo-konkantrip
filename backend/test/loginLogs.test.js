const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/config/db');
const { buildLoginLogPayload, getPropertyOwnerLoginLogs } = require('../src/controller/auth/loginLogs');

test('buildLoginLogPayload parses browser, operating system, and device info', () => {
  const req = {
    ip: '203.0.113.10',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  };

  const payload = buildLoginLogPayload(req, {
    p_owner_id: 7,
    email: 'owner@example.com',
    loginStatus: 'SUCCESS',
    failureReason: null,
    sessionId: 'session-123',
    jwtId: 'jwt-123'
  });

  assert.equal(payload.ip_address, '203.0.113.10');
  assert.equal(payload.browser, 'Chrome');
  assert.equal(payload.operating_system, 'Windows');
  assert.equal(payload.device_type, 'Desktop');
  assert.equal(payload.login_status, 'SUCCESS');
  assert.equal(payload.p_owner_id, 7);
});

test('getPropertyOwnerLoginLogs returns rows in descending order', async () => {
  const rows = [{ id: 2 }, { id: 1 }];
  const originalQuery = db.query;
  db.query = async () => [rows];

  const req = {};
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };

  await getPropertyOwnerLoginLogs(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload.data, rows);
  db.query = originalQuery;
});
