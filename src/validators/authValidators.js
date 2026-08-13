const { body } = require("express-validator");

const registerOwnerValidator = [
    body("first_name").trim().notEmpty().withMessage("First name is required"),
    body("last_name").trim().notEmpty().withMessage("Last name is required"),
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

const loginValidator = [
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
];

const updatePasswordValidator = [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
    body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error("New password and confirm password do not match");
        }
        return true;
    })
];

module.exports = {
    registerOwnerValidator,
    loginValidator,
    updatePasswordValidator
};