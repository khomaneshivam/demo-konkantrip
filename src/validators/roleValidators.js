const { body, param } = require("express-validator");

const createRoleValidator = [
    body("role_name").trim().notEmpty().withMessage("Role name is required"),
    body("role_description").optional().trim(),
    body("permission_ids").optional().isArray().withMessage("permission_ids must be an array")
];

const updateRoleValidator = [
    param("id").isInt({ min: 1 }).withMessage("Valid role ID is required"),
    body("role_name").optional().trim().notEmpty().withMessage("Role name cannot be empty"),
    body("permission_ids").optional().isArray().withMessage("permission_ids must be an array")
];

module.exports = {
    createRoleValidator,
    updateRoleValidator
};