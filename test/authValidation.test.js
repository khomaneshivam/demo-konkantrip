const test = require("node:test");
const assert = require("node:assert/strict");
const {
    validateRegister,
    validateLogin,
    validateUpdatePassword
} = require("../src/middlewares/authValidation");

// Helper function to test express-validator middleware chains
const runValidation = async (validatorChain, body) => {
    let statusCode = 200;
    let responseBody = { success: true };

    const req = {
        headers: { "content-type": "application/json" },
        body: { ...body }
    };

    const res = {
        status: (code) => {
            statusCode = code;
            return res;
        },
        json: (data) => {
            responseBody = data;
            return res;
        }
    };

    for (const middleware of validatorChain) {
        let nextCalled = false;
        await middleware(req, res, () => {
            nextCalled = true;
        });

        // If response was sent (validation failed), stop pipeline
        if (!nextCalled && statusCode !== 200) {
            break;
        }
    }

    return { statusCode, responseBody };
};

test("Validation: Accepts strong password and valid registration data", async () => {
    const validData = {
        first_name: "Rahul",
        last_name: "Sharma",
        email: "rahul.sharma@example.com",
        phone: "+919876543210",
        password: "StrongPassword@123"
    };

    const result = await runValidation(validateRegister, validData);
    assert.equal(result.statusCode, 200);
    assert.equal(result.responseBody.success, true);
});

test("Validation: Rejects weak password missing special character", async () => {
    const data = {
        first_name: "Rahul",
        last_name: "Sharma",
        email: "rahul.sharma@example.com",
        phone: "+919876543210",
        password: "Password123" // missing special char
    };

    const result = await runValidation(validateRegister, data);
    assert.equal(result.statusCode, 400);
    assert.equal(result.responseBody.success, false);
    assert.match(result.responseBody.message, /special character/i);
});

test("Validation: Rejects weak password shorter than 8 characters", async () => {
    const data = {
        first_name: "Rahul",
        last_name: "Sharma",
        email: "rahul.sharma@example.com",
        phone: "+919876543210",
        password: "P@1a" // too short
    };

    const result = await runValidation(validateRegister, data);
    assert.equal(result.statusCode, 400);
    assert.equal(result.responseBody.success, false);
    assert.match(result.responseBody.message, /between 8 and 128 characters/i);
});

test("Validation: Rejects invalid email format", async () => {
    const data = {
        first_name: "Rahul",
        last_name: "Sharma",
        email: "not-an-email",
        phone: "+919876543210",
        password: "StrongPassword@123"
    };

    const result = await runValidation(validateRegister, data);
    assert.equal(result.statusCode, 400);
    assert.equal(result.responseBody.success, false);
    assert.match(result.responseBody.message, /valid email/i);
});

test("Validation: Rejects login with missing password or username", async () => {
    const missingPassword = { email: "user@example.com" };
    const res1 = await runValidation(validateLogin, missingPassword);
    assert.equal(res1.statusCode, 400);
    assert.equal(res1.responseBody.success, false);

    const missingEmail = { password: "Secret@123" };
    const res2 = await runValidation(validateLogin, missingEmail);
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.responseBody.success, false);
});

test("Validation: Rejects update password if new password is identical to old password", async () => {
    const identicalData = {
        old_password: "OldPassword@123",
        new_password: "OldPassword@123"
    };

    const result = await runValidation(validateUpdatePassword, identicalData);
    assert.equal(result.statusCode, 400);
    assert.equal(result.responseBody.success, false);
    assert.match(result.responseBody.message, /cannot be the same/i);
});
