const { validationResult } = require("express-validator");

/**
 * Middleware factory that executes express-validator chains and sends a standardized 400 response on failure.
 * @param {Array} validations - Array of express-validator validation chains
 */
const validate = (validations = []) => {
    return async (req, res, next) => {
        // Run all validations sequentially
        for (const validation of validations) {
            await validation.run(req);
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value
            }))
        });
    };
};

module.exports = {
    validate
};