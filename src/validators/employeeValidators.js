const { body, param } = require("express-validator");

const createEmployeeValidator = [
    body("first_name").trim().notEmpty().withMessage("First name is required"),
    body("last_name").trim().notEmpty().withMessage("Last name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role_id").isInt({ min: 1 }).withMessage("Valid role_id is required")
];

const updateEmployeeValidator = [
    param("id").isInt({ min: 1 }).withMessage("Valid employee ID is required"),
    body("email").optional().trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("role_id").optional().isInt({ min: 1 }).withMessage("Valid role_id is required")
];

const assignPropertyValidator = [
    param("id").isInt({ min: 1 }).withMessage("Valid employee ID is required"),
    body("property_id").isInt({ min: 1 }).withMessage("Valid property_id is required")
];

module.exports = {
    createEmployeeValidator,
    updateEmployeeValidator,
    assignPropertyValidator
};