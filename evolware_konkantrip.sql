-- Initial schema for the Hospitality API.
-- Run this script against a new MySQL 8.0+ database. Existing installations
-- should use a versioned migration rather than editing tables in place.
CREATE DATABASE IF NOT EXISTS konkantrip
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE konkantrip;

CREATE TABLE IF NOT EXISTS property_owners (
    p_owner_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    delete_status TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = Active, 1 = Deleted',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_property_owners_uuid (uuid),
    UNIQUE KEY uq_property_owners_phone (phone),
    UNIQUE KEY uq_property_owners_email (email),
    KEY idx_property_owners_delete_status (delete_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin (
    admin_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    delete_status TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = Active, 1 = Deleted',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_admin_uuid (uuid),
    UNIQUE KEY uq_admin_phone (phone),
    UNIQUE KEY uq_admin_email (email),
    KEY idx_admin_delete_status (delete_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS properties (
    property_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_uuid CHAR(36) NOT NULL,
    p_owner_id BIGINT UNSIGNED NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    property_slug VARCHAR(255) NOT NULL,
    property_type ENUM('Hotel', 'Resort', 'Homestay', 'Villa', 'Apartment', 'Guest House', 'Hostel', 'Cottage', 'Farm Stay', 'Beach House', 'Bungalow', 'Tent', 'Camping', 'Houseboat') NOT NULL,
    property_category ENUM('Budget', 'Economy', 'Standard', 'Premium', 'Luxury', 'Boutique') NOT NULL DEFAULT 'Standard',
    property_description TEXT NULL,
    short_description VARCHAR(500) NULL,
    star_rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    check_in_time TIME NOT NULL DEFAULT '12:00:00',
    check_out_time TIME NOT NULL DEFAULT '10:00:00',
    total_rooms INT UNSIGNED NOT NULL DEFAULT 0,
    total_floors INT UNSIGNED NOT NULL DEFAULT 0,
    built_year SMALLINT UNSIGNED NULL,
    renovated_year SMALLINT UNSIGNED NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    price_display_type ENUM('Per Night', 'Per Person', 'Entire Property') NOT NULL DEFAULT 'Per Night',
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
    total_bookings INT UNSIGNED NOT NULL DEFAULT 0,
    total_views INT UNSIGNED NOT NULL DEFAULT 0,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    instant_booking TINYINT(1) NOT NULL DEFAULT 1,
    property_status ENUM('Draft', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Draft',
    approval_remarks VARCHAR(1000) NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    delete_status TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_properties_owner FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_properties_approved_by FOREIGN KEY (approved_by)
        REFERENCES admin(admin_id) ON UPDATE CASCADE ON DELETE SET NULL,
    UNIQUE KEY uq_properties_uuid (property_uuid),
    UNIQUE KEY uq_properties_slug (property_slug),
    KEY idx_properties_owner_status (p_owner_id, property_status),
    KEY idx_properties_discovery (delete_status, is_verified, is_featured, property_status),
    KEY idx_properties_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_locations (
    location_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    location_uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    property_id BIGINT UNSIGNED NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    landmark VARCHAR(255) NULL,
    village VARCHAR(150) NULL,
    taluka VARCHAR(150) NULL,
    district VARCHAR(150) NULL,
    city VARCHAR(150) NULL,
    state VARCHAR(150) NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    postal_code VARCHAR(15) NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    google_place_id VARCHAR(255) NULL,
    google_map_url VARCHAR(500) NULL,
    plus_code VARCHAR(50) NULL,
    geohash VARCHAR(20) NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    delete_status TINYINT(1) NOT NULL DEFAULT 0,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_location_property FOREIGN KEY (property_id)
        REFERENCES properties(property_id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uq_property_locations_uuid (location_uuid),
    UNIQUE KEY uq_property_locations_property (property_id),
    KEY idx_property_locations_city (city),
    KEY idx_property_locations_state (state),
    KEY idx_property_locations_district (district),
    KEY idx_property_locations_geohash (geohash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_owner_login_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    p_owner_id BIGINT UNSIGNED NULL,
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
    CONSTRAINT fk_property_owner_login FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON UPDATE CASCADE ON DELETE SET NULL,
    KEY idx_owner_login_logs_owner_time (p_owner_id, created_at),
    KEY idx_owner_login_logs_email_time (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT UNSIGNED NULL,
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
    CONSTRAINT fk_admin_login FOREIGN KEY (admin_id)
        REFERENCES admin(admin_id) ON UPDATE CASCADE ON DELETE SET NULL,
    KEY idx_admin_logs_admin_time (admin_id, created_at),
    KEY idx_admin_logs_email_time (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
