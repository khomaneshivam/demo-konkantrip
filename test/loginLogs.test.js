const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const { buildLoginLogPayload, getPropertyOwnerLoginLogs } = require('../src/controllers/auth/propertyOwnerLoginLogs');

test('buildLoginLogPayload parses browser, operating system, and device info', () => {
    const req = {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'x-forwarded-for': '203.0.113.195, 10.0.0.1',
            'x-session-id': 'sess-12345',
            'x-jwt-id': 'jwt-67890'
        },
        socket: {
            remoteAddress: '127.0.0.1'
        },
        ip: '203.0.113.195'
    };

    const payload = buildLoginLogPayload(req, {
        p_owner_id: 42,
        email: 'owner@example.com',
        loginStatus: 'SUCCESS',
        failureReason: 'Valid password login',
        sessionId: 'sess-12345',
        jwtId: 'jwt-67890'
    });

    assert.equal(payload.p_owner_id, 42);
    assert.equal(payload.email, 'owner@example.com');
    assert.equal(payload.login_status, 'SUCCESS');
    assert.equal(payload.ip_address, '203.0.113.195');
    assert.equal(payload.browser, 'Chrome');
    assert.equal(payload.operating_system, 'Windows');
    assert.equal(payload.device_type, 'Desktop');
    assert.equal(payload.session_id, 'sess-12345');
    assert.equal(payload.jwt_id, 'jwt-67890');
    assert.equal(payload.failure_reason, 'Valid password login');
});

test('getPropertyOwnerLoginLogs returns rows in descending order', async () => {
    const originalQuery = db.query;
    let capturedSql = '';

    db.query = async (sql) => {
        capturedSql = sql;
        return [[{ id: 1, p_owner_id: 7, login_status: 'SUCCESS' }]];
    };

    try {
        const req = {};
        let responseStatusCode = 200;
        let responsePayload = null;

        const res = {
            status: (code) => {
                responseStatusCode = code;
                return res;
            },
            json: (payload) => {
                responsePayload = payload;
                return res;
            }
        };

        await getPropertyOwnerLoginLogs(req, res);

        assert.equal(responseStatusCode, 200);
        assert.equal(responsePayload.success, true);
        assert.equal(responsePayload.count, 1);
        assert.equal(responsePayload.data[0].id, 1);
        assert.match(capturedSql, /ORDER BY created_at DESC/i);
    } finally {
        db.query = originalQuery;
    }
});
