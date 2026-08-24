const db = require("./db");

const DEFAULT_PERMISSIONS = [
    // Properties Module
    { module: "properties", action: "read", permission_code: "properties:read", description: "View properties and details" },
    { module: "properties", action: "create", permission_code: "properties:create", description: "Create new properties" },
    { module: "properties", action: "update", permission_code: "properties:update", description: "Update property details" },
    { module: "properties", action: "delete", permission_code: "properties:delete", description: "Delete/Deactivate properties" },
    { module: "properties", action: "manage", permission_code: "properties:manage", description: "Manage sub-resources (images, policies, amenities)" },

    // Rooms Module
    { module: "rooms", action: "read", permission_code: "rooms:read", description: "View rooms and room details" },
    { module: "rooms", action: "create", permission_code: "rooms:create", description: "Create new rooms" },
    { module: "rooms", action: "update", permission_code: "rooms:update", description: "Update room details and status" },
    { module: "rooms", action: "delete", permission_code: "rooms:delete", description: "Delete/Deactivate rooms" },
    { module: "rooms", action: "manage", permission_code: "rooms:manage", description: "Manage room sub-resources (beds, amenities, facilities)" },

    // Inventory & Rates Module
    { module: "inventory", action: "read", permission_code: "inventory:read", description: "View inventory calendar, stock, and transactions" },
    { module: "inventory", action: "update", permission_code: "inventory:update", description: "Update daily availability and stock" },
    { module: "inventory", action: "manage_blocks", permission_code: "inventory:manage_blocks", description: "Create and release room blocks" },
    { module: "inventory", action: "manage_stopsell", permission_code: "inventory:manage_stopsell", description: "Create and release stop-sell rules" },

    // Bookings & Front Desk Module
    { module: "bookings", action: "read", permission_code: "bookings:read", description: "View reservations and guest lists" },
    { module: "bookings", action: "create", permission_code: "bookings:create", description: "Create new reservations" },
    { module: "bookings", action: "update", permission_code: "bookings:update", description: "Modify reservations, check-in, and check-out" },
    { module: "bookings", action: "delete", permission_code: "bookings:delete", description: "Cancel reservations" },

    // Housekeeping Module
    { module: "housekeeping", action: "read", permission_code: "housekeeping:read", description: "View room cleanliness and housekeeping status" },
    { module: "housekeeping", action: "update", permission_code: "housekeeping:update", description: "Update room cleaning and inspection status" },

    // Maintenance Module
    { module: "maintenance", action: "read", permission_code: "maintenance:read", description: "View maintenance requests and tasks" },
    { module: "maintenance", action: "manage", permission_code: "maintenance:manage", description: "Create, update, and resolve maintenance tasks" },

    // CRM & Employees Module
    { module: "employees", action: "read", permission_code: "employees:read", description: "View employee profiles and assignments" },
    { module: "employees", action: "create", permission_code: "employees:create", description: "Add new employees" },
    { module: "employees", action: "update", permission_code: "employees:update", description: "Update employee profiles and roles" },
    { module: "employees", action: "delete", permission_code: "employees:delete", description: "Deactivate/Delete employees" },

    // Roles & RBAC Module
    { module: "roles", action: "read", permission_code: "roles:read", description: "View roles and role permissions" },
    { module: "roles", action: "create", permission_code: "roles:create", description: "Create custom roles" },
    { module: "roles", action: "update", permission_code: "roles:update", description: "Update custom roles and permissions" },
    { module: "roles", action: "delete", permission_code: "roles:delete", description: "Delete custom roles" },

    // Pricing Module
    { module: "pricing", action: "read", permission_code: "pricing:read", description: "View room rates, seasonal tariffs, and bulk pricing rules" },
    { module: "pricing", action: "update", permission_code: "pricing:update", description: "Configure base rates, seasonal price rules, and discounts" },

    // Audit Trail & Governance Module
    { module: "audit", action: "read", permission_code: "audit:read", description: "View audit trail activity logs and inspection records" },
    { module: "audit", action: "export", permission_code: "audit:export", description: "Export enterprise audit logs to CSV" },

    // Financials & Reports Module
    { module: "reports", action: "read", permission_code: "reports:read", description: "View revenue, occupancy, and analytics reports" },
    { module: "financials", action: "read", permission_code: "financials:read", description: "View invoices, payments, and financial accounts" }
];

const DEFAULT_SYSTEM_ROLES = [
    {
        role_name: "Property Manager",
        role_slug: "property-manager",
        role_description: "Full management access across all assigned property modules",
        is_system_role: true,
        permissions: [
            "properties:read", "properties:update", "properties:manage",
            "rooms:read", "rooms:create", "rooms:update", "rooms:manage",
            "inventory:read", "inventory:update", "inventory:manage_blocks", "inventory:manage_stopsell",
            "pricing:read", "pricing:update",
            "bookings:read", "bookings:create", "bookings:update", "bookings:delete",
            "housekeeping:read", "housekeeping:update",
            "maintenance:read", "maintenance:manage",
            "employees:read", "employees:create", "employees:update",
            "roles:read", "audit:read", "audit:export", "reports:read", "financials:read"
        ]
    },
    {
        role_name: "Front Desk / Receptionist",
        role_slug: "front-desk",
        role_description: "Handles guest check-ins, reservations, room availability, and guest requests",
        is_system_role: true,
        permissions: [
            "properties:read",
            "rooms:read", "rooms:update",
            "inventory:read",
            "bookings:read", "bookings:create", "bookings:update",
            "housekeeping:read"
        ]
    },
    {
        role_name: "Housekeeping Supervisor",
        role_slug: "housekeeping-supervisor",
        role_description: "Manages room cleaning schedules, room inspection, and housekeeping status",
        is_system_role: true,
        permissions: [
            "properties:read",
            "rooms:read", "rooms:update",
            "housekeeping:read", "housekeeping:update"
        ]
    },
    {
        role_name: "Maintenance Staff",
        role_slug: "maintenance-staff",
        role_description: "Handles facility maintenance, repair tickets, and maintenance room blocks",
        is_system_role: true,
        permissions: [
            "properties:read",
            "rooms:read",
            "inventory:read", "inventory:manage_blocks",
            "maintenance:read", "maintenance:manage"
        ]
    },
    {
        role_name: "Accountant / Finance",
        role_slug: "accountant-finance",
        role_description: "Views billing, payment settlements, revenue reports, and inventory rates",
        is_system_role: true,
        permissions: [
            "properties:read",
            "rooms:read",
            "inventory:read",
            "bookings:read",
            "reports:read",
            "financials:read"
        ]
    },
    {
        role_name: "Sales & Marketing",
        role_slug: "sales-marketing",
        role_description: "Oversees room rates, stop-sells, inventory availability, and promotional inquiries",
        is_system_role: true,
        permissions: [
            "properties:read",
            "rooms:read",
            "inventory:read", "inventory:update", "inventory:manage_stopsell",
            "bookings:read",
            "reports:read"
        ]
    }
];

async function initializeEmployeeTables() {
    try {
        console.log("Initializing Employee, Role, and RBAC tables...");

        // 1. permissions Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS permissions (
                permission_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                module VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                permission_code VARCHAR(100) NOT NULL,
                description VARCHAR(255) NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_permission_code (permission_code),
                KEY idx_permissions_module (module),
                KEY idx_permissions_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. employee_roles Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS employee_roles (
                role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                p_owner_id BIGINT UNSIGNED NULL,
                role_name VARCHAR(100) NOT NULL,
                role_slug VARCHAR(100) NOT NULL,
                role_description VARCHAR(255) NULL,
                is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                delete_status BOOLEAN NOT NULL DEFAULT FALSE,
                created_by BIGINT UNSIGNED NULL,
                updated_by BIGINT UNSIGNED NULL,
                deleted_by BIGINT UNSIGNED NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                KEY idx_roles_owner (p_owner_id),
                KEY idx_roles_slug (role_slug),
                KEY idx_roles_system (is_system_role),
                KEY idx_roles_active_delete (is_active, delete_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. role_permissions Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id BIGINT UNSIGNED NOT NULL,
                permission_id BIGINT UNSIGNED NOT NULL,
                PRIMARY KEY (role_id, permission_id),
                CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id)
                    REFERENCES employee_roles(role_id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id)
                    REFERENCES permissions(permission_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. employees Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS employees (
                employee_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                uuid CHAR(36) NOT NULL DEFAULT (UUID()),
                p_owner_id BIGINT UNSIGNED NOT NULL,
                role_id BIGINT UNSIGNED NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                password VARCHAR(255) NOT NULL,
                avatar_url VARCHAR(500) NULL,
                gender ENUM('Male', 'Female', 'Other') NULL,
                date_of_birth DATE NULL,
                joining_date DATE NULL,
                salary DECIMAL(10,2) NULL,
                designation VARCHAR(100) NULL,
                department VARCHAR(100) NULL,
                employment_type ENUM('Full-Time', 'Part-Time', 'Contract', 'Intern') NOT NULL DEFAULT 'Full-Time',
                emergency_contact_name VARCHAR(100) NULL,
                emergency_contact_phone VARCHAR(20) NULL,
                address TEXT NULL,
                id_proof_type VARCHAR(50) NULL,
                id_proof_number VARCHAR(100) NULL,
                status ENUM('Active', 'Inactive', 'Suspended', 'Terminated') NOT NULL DEFAULT 'Active',
                delete_status BOOLEAN NOT NULL DEFAULT FALSE,
                created_by BIGINT UNSIGNED NULL,
                updated_by BIGINT UNSIGNED NULL,
                deleted_by BIGINT UNSIGNED NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                UNIQUE KEY uq_employees_uuid (uuid),
                KEY idx_employees_owner (p_owner_id),
                KEY idx_employees_role (role_id),
                KEY idx_employees_email (email),
                KEY idx_employees_phone (phone),
                KEY idx_employees_status (status),
                KEY idx_employees_delete_status (delete_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. property_employees Table (Mapping)
        await db.query(`
            CREATE TABLE IF NOT EXISTS property_employees (
                mapping_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                property_id BIGINT UNSIGNED NOT NULL,
                employee_id BIGINT UNSIGNED NOT NULL,
                is_primary BOOLEAN NOT NULL DEFAULT FALSE,
                status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
                delete_status BOOLEAN NOT NULL DEFAULT FALSE,
                created_by BIGINT UNSIGNED NULL,
                updated_by BIGINT UNSIGNED NULL,
                deleted_by BIGINT UNSIGNED NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                UNIQUE KEY uq_property_employee (property_id, employee_id),
                KEY idx_pe_property (property_id),
                KEY idx_pe_employee (employee_id),
                KEY idx_pe_status_delete (status, delete_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. employee_login_logs Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS employee_login_logs (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                employee_id BIGINT UNSIGNED NULL,
                email VARCHAR(255) NULL,
                login_status ENUM('SUCCESS', 'FAILED') NOT NULL,
                failure_reason VARCHAR(255) NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                device_type VARCHAR(100) NULL,
                browser VARCHAR(100) NULL,
                operating_system VARCHAR(100) NULL,
                login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                logout_time TIMESTAMP NULL,
                session_id VARCHAR(255) NULL,
                jwt_id VARCHAR(255) NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_employee_logs_time (employee_id, created_at),
                KEY idx_employee_logs_email (email, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Seed Permissions
        for (const p of DEFAULT_PERMISSIONS) {
            await db.query(
                `INSERT INTO permissions (module, action, permission_code, description, is_active)
                 VALUES (?, ?, ?, ?, TRUE)
                 ON DUPLICATE KEY UPDATE description = VALUES(description), is_active = VALUES(is_active)`,
                [p.module, p.action, p.permission_code, p.description]
            );
        }

        // Fetch permission IDs map
        const [permRows] = await db.query("SELECT permission_id, permission_code FROM permissions");
        const permMap = new Map(permRows.map(r => [r.permission_code, r.permission_id]));

        // Seed Default System Roles and Permissions
        for (const r of DEFAULT_SYSTEM_ROLES) {
            const [existingRole] = await db.query(
                "SELECT role_id FROM employee_roles WHERE role_slug = ? AND p_owner_id IS NULL AND is_system_role = TRUE LIMIT 1",
                [r.role_slug]
            );

            let roleId;
            if (existingRole.length > 0) {
                roleId = existingRole[0].role_id;
                await db.query(
                    "UPDATE employee_roles SET role_name = ?, role_description = ?, is_active = TRUE, delete_status = FALSE WHERE role_id = ?",
                    [r.role_name, r.role_description, roleId]
                );
            } else {
                const [insertResult] = await db.query(
                    `INSERT INTO employee_roles (p_owner_id, role_name, role_slug, role_description, is_system_role, is_active, delete_status)
                     VALUES (NULL, ?, ?, ?, TRUE, TRUE, FALSE)`,
                    [r.role_name, r.role_slug, r.role_description]
                );
                roleId = insertResult.insertId;
            }

            // Assign permissions to system role
            for (const permCode of r.permissions) {
                const permId = permMap.get(permCode);
                if (permId) {
                    await db.query(
                        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
                        [roleId, permId]
                    );
                }
            }
        }

        console.log("Employee, Role, and RBAC tables initialized successfully.");
        return true;
    } catch (error) {
        console.error("Failed to initialize employee tables:", error);
        return false;
    }
}

module.exports = {
    DEFAULT_PERMISSIONS,
    DEFAULT_SYSTEM_ROLES,
    initializeEmployeeTables
};