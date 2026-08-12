const { body, validationResult } = require("express-validator");

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    return next();
};

/**
 * Password validation rule:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (@$!%*?&#^()_\-+={}[\]:;"'<>,.?/~`|)
 */
const passwordValidationRule = (fieldName = "password") => {
    return body(fieldName)
        .notEmpty().withMessage(`${fieldName} is required`)
        .isLength({ min: 8, max: 128 }).withMessage(`${fieldName} must be between 8 and 128 characters long`)
        .matches(/[A-Z]/).withMessage(`${fieldName} must contain at least one uppercase letter (A-Z)`)
        .matches(/[a-z]/).withMessage(`${fieldName} must contain at least one lowercase letter (a-z)`)
        .matches(/[0-9]/).withMessage(`${fieldName} must contain at least one number (0-9)`)
        .matches(/[@$!%*?&#^()_\-+={}[\]:;"'<>,.?/~`|\\]/).withMessage(`${fieldName} must contain at least one special character (@, $, !, %, *, ?, &, #, etc.)`);
};

/**
 * Validation rules for user/admin registration
 */
const validateRegister = [
    body("first_name")
        .trim()
        .notEmpty().withMessage("First name is required")
        .isLength({ min: 2, max: 100 }).withMessage("First name must be between 2 and 100 characters")
        .matches(/^[a-zA-Z\s'-]+$/).withMessage("First name contains invalid characters"),

    body("last_name")
        .trim()
        .notEmpty().withMessage("Last name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Last name must be between 2 and 100 characters")
        .matches(/^[a-zA-Z\s'-]+$/).withMessage("Last name contains invalid characters"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please enter a valid email address")
        .normalizeEmail(),

    body("phone")
        .trim()
        .notEmpty().withMessage("Phone number is required")
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/).withMessage("Please enter a valid phone number (7-15 digits)"),

    passwordValidationRule("password"),

    handleValidationErrors
];

/**
 * Validation rules for user/admin login
 */
const validateLogin = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email or username is required"),

    body("password")
        .notEmpty().withMessage("Password is required"),

    body("remember_me")
        .optional()
        .isBoolean().withMessage("remember_me must be a boolean"),

    body("rememberMe")
        .optional()
        .isBoolean().withMessage("rememberMe must be a boolean"),

    handleValidationErrors
];

/**
 * Validation rules for updating password
 */
const validateUpdatePassword = [
    body("old_password")
        .notEmpty().withMessage("Old password is required"),

    passwordValidationRule("new_password")
        .custom((value, { req }) => {
            if (value === req.body.old_password) {
                throw new Error("New password cannot be the same as the old password");
            }
            return true;
        }),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    passwordValidationRule,
    validateRegister,
    validateLogin,
    validateUpdatePassword
};
