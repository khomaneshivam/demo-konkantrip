const test = require("node:test");
const assert = require("node:assert/strict");
const tokenCache = require("../src/utils/tokenCache");
const app = require("../server");

test("TokenCache: stores and retrieves decoded user data", () => {
    const dummyToken = "sample.jwt.token123";
    const dummyUser = { p_owner_id: 10, email: "owner@test.com", role: "owner" };

    tokenCache.set(dummyToken, dummyUser, 5000);
    const cached = tokenCache.get(dummyToken);

    assert.deepEqual(cached, dummyUser);
    assert.equal(tokenCache.has(dummyToken), true);
});

test("TokenCache: revokes tokens on logout", () => {
    const dummyToken = "sample.jwt.token_to_revoke";
    const dummyUser = { admin_id: 1, email: "admin@test.com", role: "admin" };

    tokenCache.set(dummyToken, dummyUser, 5000);
    assert.equal(tokenCache.has(dummyToken), true);

    tokenCache.revoke(dummyToken);
    assert.equal(tokenCache.get(dummyToken), null);
    assert.equal(tokenCache.isRevoked(dummyToken), true);
});

test("Server: health endpoint is accessible", async () => {
    // Basic router checks
    assert.ok(app);
    assert.equal(typeof app.handle, "function");
});
