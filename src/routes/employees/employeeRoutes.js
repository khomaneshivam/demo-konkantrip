const express = require("express");
const router = express.Router();
const employeesCtrl = require("../../controllers/employees/employees");
const rolesCtrl = require("../../controllers/employees/roles");
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireOwnerOrAdmin, requirePermission, requirePropertyOwnership } = require("../../middlewares/roleMiddleware");
const { validate } = require("../../middlewares/validationMiddleware");
const { createEmployeeValidator, updateEmployeeValidator, assignPropertyValidator } = require("../../validators/employeeValidators");
const { createRoleValidator, updateRoleValidator } = require("../../validators/roleValidators");

// --- Permissions & Roles ---
router.get("/permissions", authMiddleware, requireOwnerOrAdmin, rolesCtrl.getPermissions);

router.get("/roles", authMiddleware, requireOwnerOrAdmin, rolesCtrl.getRoles);
router.get("/roles/:id", authMiddleware, requireOwnerOrAdmin, rolesCtrl.getRoleById);
router.post("/roles", authMiddleware, requireOwnerOrAdmin, requirePermission("roles:create"), validate(createRoleValidator), rolesCtrl.createRole);
router.put("/roles/:id", authMiddleware, requireOwnerOrAdmin, requirePermission("roles:update"), validate(updateRoleValidator), rolesCtrl.updateRole);
router.delete("/roles/:id", authMiddleware, requireOwnerOrAdmin, requirePermission("roles:delete"), rolesCtrl.deleteRole);

// --- Employees (CRM) ---
router.get("/employees", authMiddleware, requireOwnerOrAdmin, requirePermission("employees:read"), employeesCtrl.getEmployees);
router.get("/employees/:id", authMiddleware, requireOwnerOrAdmin, requirePermission("employees:read"), employeesCtrl.getEmployeeById);
router.post("/employees", authMiddleware, requireOwnerOrAdmin, requirePermission("employees:create"), validate(createEmployeeValidator), employeesCtrl.createEmployee);
router.put("/employees/:id", authMiddleware, requireOwnerOrAdmin, requirePermission("employees:update"), validate(updateEmployeeValidator), employeesCtrl.updateEmployee);
router.delete("/employees/:id", authMiddleware, requireOwnerOrAdmin, requirePermission("employees:delete"), employeesCtrl.deleteEmployee);

// --- Employee Property Assignments ---
router.post("/employees/assign-property/:id", authMiddleware, requireOwnerOrAdmin, requirePermission("employees:update"), validate(assignPropertyValidator), employeesCtrl.assignEmployeeProperty);
router.delete("/employees/unassign-property/:id/:propertyId", authMiddleware, requireOwnerOrAdmin, requirePermission("employees:update"), employeesCtrl.unassignEmployeeProperty);

// --- Property-Specific Employees List ---
router.get("/properties/employees/:propertyId", authMiddleware, requirePropertyOwnership, requirePermission("employees:read"), employeesCtrl.getPropertyEmployees);

module.exports = router;