const express = require("express");
const router = express.Router();
const employeesCtrl = require("../../controllers/employees/employees");
const rolesCtrl = require("../../controllers/employees/roles");
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireOwnerOrAdmin, requirePermission, requirePropertyOwnership } = require("../../middlewares/roleMiddleware");
const { validate } = require("../../middlewares/validationMiddleware");
const { createEmployeeValidator, updateEmployeeValidator, assignPropertyValidator } = require("../../validators/employeeValidators");
const { createRoleValidator, updateRoleValidator } = require("../../validators/roleValidators");

// All routes require authentication
router.use(authMiddleware);

// --- Permissions & Roles ---
router.get("/permissions", requireOwnerOrAdmin, rolesCtrl.getPermissions);

router.get("/roles", requireOwnerOrAdmin, rolesCtrl.getRoles);
router.get("/roles/:id", requireOwnerOrAdmin, rolesCtrl.getRoleById);
router.post("/roles", requireOwnerOrAdmin, requirePermission("roles:create"), validate(createRoleValidator), rolesCtrl.createRole);
router.put("/roles/:id", requireOwnerOrAdmin, requirePermission("roles:update"), validate(updateRoleValidator), rolesCtrl.updateRole);
router.delete("/roles/:id", requireOwnerOrAdmin, requirePermission("roles:delete"), rolesCtrl.deleteRole);

// --- Employees (CRM) ---
router.get("/employees", requireOwnerOrAdmin, requirePermission("employees:read"), employeesCtrl.getEmployees);
router.get("/employees/:id", requireOwnerOrAdmin, requirePermission("employees:read"), employeesCtrl.getEmployeeById);
router.post("/employees", requireOwnerOrAdmin, requirePermission("employees:create"), validate(createEmployeeValidator), employeesCtrl.createEmployee);
router.put("/employees/:id", requireOwnerOrAdmin, requirePermission("employees:update"), validate(updateEmployeeValidator), employeesCtrl.updateEmployee);
router.delete("/employees/:id", requireOwnerOrAdmin, requirePermission("employees:delete"), employeesCtrl.deleteEmployee);

// --- Employee Property Assignments ---
router.post("/employees/assign-property/:id", requireOwnerOrAdmin, requirePermission("employees:update"), validate(assignPropertyValidator), employeesCtrl.assignEmployeeProperty);
router.delete("/employees/unassign-property/:id/:propertyId", requireOwnerOrAdmin, requirePermission("employees:update"), employeesCtrl.unassignEmployeeProperty);

// --- Property-Specific Employees List ---
router.get("/properties/employees/:propertyId", requirePropertyOwnership, requirePermission("employees:read"), employeesCtrl.getPropertyEmployees);

module.exports = router;