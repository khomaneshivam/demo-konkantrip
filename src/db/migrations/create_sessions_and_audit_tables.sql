/* =============================================================================
   SALESFORCE-STYLE ENTERPRISE SESSION & AUDIT TRAIL TABLES
   ============================================================================= */

CREATE TABLE IF NOT EXISTS employee_sessions (
    session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    employee_id BIGINT UNSIGNED NOT NULL,
    p_owner_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of JWT or session token',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_type VARCHAR(50) DEFAULT 'Desktop',
    browser VARCHAR(50) DEFAULT 'Chrome',
    os VARCHAR(50) DEFAULT 'Windows',
    login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Active, 0 = Revoked/Expired',
    revoked_at TIMESTAMP NULL,
    revoked_by BIGINT UNSIGNED NULL,
    KEY idx_emp_sessions_employee_id (employee_id),
    KEY idx_emp_sessions_p_owner_id (p_owner_id),
    KEY idx_emp_sessions_token_hash (token_hash),
    KEY idx_emp_sessions_is_active (is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    p_owner_id BIGINT UNSIGNED NOT NULL,
    property_id BIGINT UNSIGNED NULL,
    employee_id BIGINT UNSIGNED NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    user_type ENUM('owner', 'employee', 'admin', 'system') NOT NULL DEFAULT 'employee',
    module VARCHAR(50) NOT NULL COMMENT 'e.g. Properties, Rooms, Inventory, Bookings, Pricing, Staff, Roles, Auth',
    action VARCHAR(50) NOT NULL COMMENT 'e.g. CREATE, UPDATE, DELETE, LOGIN, LOGOUT, STATUS_CHANGE, PRICE_OVERRIDE',
    record_id VARCHAR(100) NULL,
    record_name VARCHAR(255) NULL,
    description TEXT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    changes_diff JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_trail_p_owner_id (p_owner_id),
    KEY idx_audit_trail_property_id (property_id),
    KEY idx_audit_trail_employee_id (employee_id),
    KEY idx_audit_trail_module (module),
    KEY idx_audit_trail_action (action),
    KEY idx_audit_trail_created_at (created_at)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
