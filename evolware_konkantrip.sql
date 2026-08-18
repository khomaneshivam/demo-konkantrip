/* =============================================================================
   DATABASE INITIALIZATION & CONFIGURATION
   ============================================================================= */

CREATE DATABASE IF NOT EXISTS konkantrip
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE konkantrip;

SET FOREIGN_KEY_CHECKS = 0;

/* =============================================================================
   DROP EXISTING TABLES (REVERSE DEPENDENCY ORDER)
   ============================================================================= */

DROP TABLE IF EXISTS employee_sessions;
DROP TABLE IF EXISTS audit_trail;
DROP TABLE IF EXISTS employee_login_logs;
DROP TABLE IF EXISTS property_employees;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS employee_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS room_seasonal_rates;
DROP TABLE IF EXISTS stop_sell;
DROP TABLE IF EXISTS room_blocks;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS inventory_calendar;
DROP TABLE IF EXISTS room_inventory;
DROP TABLE IF EXISTS room_facilities_mapping;
DROP TABLE IF EXISTS room_amenities;
DROP TABLE IF EXISTS room_beds;
DROP TABLE IF EXISTS room_images;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS property_languages;
DROP TABLE IF EXISTS property_documents;
DROP TABLE IF EXISTS property_statistics;
DROP TABLE IF EXISTS property_nearby_places;
DROP TABLE IF EXISTS property_house_rules;
DROP TABLE IF EXISTS property_policies;
DROP TABLE IF EXISTS property_tags;
DROP TABLE IF EXISTS property_highlights;
DROP TABLE IF EXISTS property_amenities;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS property_contacts;
DROP TABLE IF EXISTS property_locations;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS meal_plans;
DROP TABLE IF EXISTS room_facilities;
DROP TABLE IF EXISTS room_facility_categories;
DROP TABLE IF EXISTS room_image_types;
DROP TABLE IF EXISTS room_views;
DROP TABLE IF EXISTS room_status;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS bed_types;
DROP TABLE IF EXISTS certification_types;
DROP TABLE IF EXISTS contact_types;
DROP TABLE IF EXISTS property_image_types;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS amenity_categories;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS property_house_rule_categories;
DROP TABLE IF EXISTS nearby_place_types;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS property_owner_login_logs;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS property_owners;

/* =============================================================================
   SECTION 1: CORE AUTHENTICATION & USERS
   ============================================================================= */

/* =============================================================================
   SECTION 1: CORE AUTHENTICATION & USERS
   ============================================================================= */

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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

/* =============================================================================
   SECTION 2: PROPERTY MASTER & LOOKUP TABLES
   ============================================================================= */

/* =============================================================================
   SECTION 2: PROPERTY MASTER & LOOKUP TABLES
   ============================================================================= */

CREATE TABLE IF NOT EXISTS languages (

    language_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    language_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    language_name VARCHAR(100)
        NOT NULL UNIQUE,

    native_name VARCHAR(100)
        NOT NULL,

    iso_639_1 CHAR(2)
        NOT NULL UNIQUE,

    iso_639_2 CHAR(3)
        UNIQUE,

    language_code VARCHAR(10)
        NOT NULL UNIQUE,

    text_direction ENUM(
        'LTR',
        'RTL'
    ) DEFAULT 'LTR',

    flag_icon VARCHAR(255),

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_indian_language BOOLEAN
        DEFAULT FALSE,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_language_name(language_name),

    INDEX idx_language_code(language_code),

    INDEX idx_iso6391(iso_639_1),

    INDEX idx_active(is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_types (

    document_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    document_type_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    document_name VARCHAR(150)
        NOT NULL UNIQUE,

    document_slug VARCHAR(150)
        NOT NULL UNIQUE,

    document_category ENUM(

        'Identity',

        'Business',

        'Tax',

        'License',

        'Government',

        'Insurance',

        'Safety',

        'Legal',

        'Property',

        'Other'

    ) NOT NULL DEFAULT 'Other',

    description VARCHAR(500),

    accepted_file_types JSON,

    max_file_size_mb SMALLINT UNSIGNED
        DEFAULT 10,

    is_mandatory BOOLEAN DEFAULT FALSE,

    requires_expiry BOOLEAN DEFAULT FALSE,

    requires_verification BOOLEAN DEFAULT TRUE,

    validity_period_days SMALLINT UNSIGNED,

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_document_slug(document_slug),

    INDEX idx_document_category(document_category),

    INDEX idx_document_active(is_active),

    INDEX idx_document_mandatory(is_mandatory)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nearby_place_types (

    nearby_place_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nearby_place_type_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    place_type_name VARCHAR(100)
        NOT NULL UNIQUE,

    place_type_slug VARCHAR(120)
        NOT NULL UNIQUE,

    place_icon VARCHAR(255),

    marker_color VARCHAR(20),

    description VARCHAR(255),

    display_order SMALLINT UNSIGNED DEFAULT 1,

    is_transport BOOLEAN DEFAULT FALSE,

    is_tourist_place BOOLEAN DEFAULT FALSE,

    is_essential_service BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_place_slug(place_type_slug),

    INDEX idx_place_status(is_active),

    INDEX idx_place_order(display_order)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_house_rule_categories (

    rule_category_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    rule_category_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    category_name VARCHAR(100)
        NOT NULL UNIQUE,

    category_icon VARCHAR(255),

    description VARCHAR(255),

    display_order SMALLINT DEFAULT 1,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (

    tag_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    tag_uuid CHAR(36)
        NOT NULL DEFAULT(UUID()) UNIQUE,

    tag_name VARCHAR(100)
        UNIQUE NOT NULL,

    tag_slug VARCHAR(120)
        UNIQUE NOT NULL,

    tag_color VARCHAR(20),
    is_active BOOLEAN,

    display_order SMALLINT DEFAULT 1,

    status BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amenity_categories (

    amenity_category_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    amenity_category_uuid CHAR(36)
        NOT NULL DEFAULT(UUID()) UNIQUE,

    category_name VARCHAR(100)
        UNIQUE NOT NULL,

    category_icon VARCHAR(255),

    display_order SMALLINT DEFAULT 1,

    status BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amenities (

    amenity_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    amenity_uuid CHAR(36)
        NOT NULL DEFAULT(UUID()) UNIQUE,

    amenity_category_id SMALLINT UNSIGNED NOT NULL,

    amenity_name VARCHAR(150)
        UNIQUE NOT NULL,

    amenity_icon VARCHAR(255),

    amenity_description VARCHAR(500),

    display_order SMALLINT DEFAULT 1,

    is_popular BOOLEAN DEFAULT FALSE,

    status BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_amenity_category
        FOREIGN KEY(amenity_category_id)
        REFERENCES amenity_categories(amenity_category_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_image_types (

    image_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    image_type_uuid CHAR(36)
        NOT NULL DEFAULT(UUID()) UNIQUE,

    image_type_name VARCHAR(100)
        NOT NULL UNIQUE,

    description VARCHAR(255),

    display_order SMALLINT DEFAULT 1,

    status BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_types (

    contact_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    contact_type_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    contact_type_name VARCHAR(100)
        NOT NULL UNIQUE,

    description VARCHAR(255),

    display_order SMALLINT DEFAULT 1,

    status TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certification_types (

    certification_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    certification_type_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    certification_name VARCHAR(200)
        NOT NULL UNIQUE,

    certification_slug VARCHAR(200)
        NOT NULL UNIQUE,

    certification_category ENUM(

        'Government',

        'Safety',

        'Tourism',

        'Quality',

        'Environmental',

        'Business',

        'Food',

        'Health',

        'Insurance',

        'Other'

    ) DEFAULT 'Other',

    issuing_authority VARCHAR(255),

    description VARCHAR(500),

    validity_required BOOLEAN DEFAULT TRUE,

    default_validity_years SMALLINT UNSIGNED,

    mandatory_for_property BOOLEAN DEFAULT FALSE,

    renewable BOOLEAN DEFAULT TRUE,

    verification_required BOOLEAN DEFAULT TRUE,

    display_order SMALLINT UNSIGNED DEFAULT 1,

    certification_icon VARCHAR(255),

    website_url VARCHAR(500),

    is_active BOOLEAN DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name(certification_name),

    INDEX idx_slug(certification_slug),

    INDEX idx_category(certification_category),

    INDEX idx_active(is_active),

    INDEX idx_mandatory(mandatory_for_property)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

/* =============================================================================
   SECTION 3: ROOM MASTER & LOOKUP TABLES
   ============================================================================= */

/* =============================================================================
   SECTION 3: ROOM MASTER & LOOKUP TABLES
   ============================================================================= */

CREATE TABLE IF NOT EXISTS bed_types (

    bed_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    bed_type_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    bed_type_name VARCHAR(100)
        NOT NULL UNIQUE,

    bed_type_slug VARCHAR(120)
        NOT NULL UNIQUE,

    short_name VARCHAR(20),

    description VARCHAR(500),

    bed_size VARCHAR(50),

    width_cm SMALLINT UNSIGNED,

    length_cm SMALLINT UNSIGNED,

    maximum_occupancy TINYINT UNSIGNED
        DEFAULT 2,

    suitable_for VARCHAR(255),

    icon VARCHAR(255),

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_standard BOOLEAN
        DEFAULT TRUE,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_bed_type_slug(bed_type_slug),

    INDEX idx_bed_type_name(bed_type_name),

    INDEX idx_standard(is_standard),

    INDEX idx_active(is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_types (

    room_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_type_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    room_type_name VARCHAR(100)
        NOT NULL UNIQUE,

    room_type_slug VARCHAR(120)
        NOT NULL UNIQUE,

    short_name VARCHAR(30),

    room_category ENUM(

        'Hotel',

        'Resort',

        'Villa',

        'Apartment',

        'Homestay',

        'Cottage',

        'Tent',

        'Dormitory',

        'Hostel',

        'Other'

    ) DEFAULT 'Hotel',

    description VARCHAR(500),

    default_guest_capacity TINYINT UNSIGNED
        DEFAULT 2,

    maximum_guest_capacity TINYINT UNSIGNED
        DEFAULT 2,

    default_room_area DECIMAL(8,2),

    room_area_unit ENUM(

        'Sq.ft',

        'Sq.m'

    ) DEFAULT 'Sq.ft',

    default_bathrooms TINYINT UNSIGNED
        DEFAULT 1,

    default_balcony BOOLEAN
        DEFAULT FALSE,

    default_kitchen BOOLEAN
        DEFAULT FALSE,

    default_living_room BOOLEAN
        DEFAULT FALSE,

    default_air_conditioning BOOLEAN
        DEFAULT TRUE,

    default_wifi BOOLEAN
        DEFAULT TRUE,

    default_breakfast BOOLEAN
        DEFAULT FALSE,

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_room_type_slug(room_type_slug),

    INDEX idx_room_category(room_category),

    INDEX idx_room_active(is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_status (

    room_status_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_status_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    status_name VARCHAR(100)
        NOT NULL UNIQUE,

    status_slug VARCHAR(100)
        NOT NULL UNIQUE,

    description VARCHAR(500),

    status_color VARCHAR(20),

    status_icon VARCHAR(255),

    is_bookable BOOLEAN
        DEFAULT TRUE,

    affects_inventory BOOLEAN
        DEFAULT TRUE,

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_system_status BOOLEAN
        DEFAULT TRUE,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_room_status_slug(status_slug),

    INDEX idx_room_status_name(status_name),

    INDEX idx_room_status_bookable(is_bookable),

    INDEX idx_room_status_inventory(affects_inventory),

    INDEX idx_room_status_active(is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_views (

    room_view_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_view_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    room_view_name VARCHAR(100)
        NOT NULL UNIQUE,

    room_view_slug VARCHAR(120)
        NOT NULL UNIQUE,

    short_name VARCHAR(20),

    description VARCHAR(500),

    icon VARCHAR(255),

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    premium_view BOOLEAN
        DEFAULT FALSE,

    additional_charge DECIMAL(10,2)
        DEFAULT 0.00,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_room_view_slug(room_view_slug),

    INDEX idx_room_view_name(room_view_name),

    INDEX idx_premium_view(premium_view),

    INDEX idx_room_view_active(is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_image_types (

    room_image_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_image_type_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    image_type_name VARCHAR(100)
        NOT NULL UNIQUE,

    image_type_slug VARCHAR(120)
        NOT NULL UNIQUE,

    description VARCHAR(500),

    image_category ENUM(

        'Interior',

        'Exterior',

        'Facility',

        'Floor Plan',

        'View',

        'Bathroom',

        'Bedroom',

        'Dining',

        'Other'

    ) DEFAULT 'Interior',

    recommended_width INT UNSIGNED,

    recommended_height INT UNSIGNED,

    allowed_formats JSON,

    max_file_size_mb SMALLINT UNSIGNED
        DEFAULT 10,

    is_cover_allowed BOOLEAN
        DEFAULT FALSE,

    is_required BOOLEAN
        DEFAULT FALSE,

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_image_slug(image_type_slug),

    INDEX idx_image_category(image_category),

    INDEX idx_cover(is_cover_allowed),

    INDEX idx_required(is_required),

    INDEX idx_active(is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_facility_categories (

    room_facility_category_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_facility_category_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    category_name VARCHAR(100)
        NOT NULL UNIQUE,

    category_slug VARCHAR(120)
        NOT NULL UNIQUE,

    category_description VARCHAR(500),

    category_icon VARCHAR(255),

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_room_facility_category_slug(category_slug),

    INDEX idx_room_facility_category_name(category_name),

    INDEX idx_room_facility_category_active(is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_facilities (
    room_facility_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_facility_uuid CHAR(36) NOT NULL DEFAULT (UUID()) UNIQUE,
    room_facility_category_id SMALLINT UNSIGNED NOT NULL,
    facility_name VARCHAR(150) NOT NULL UNIQUE,
    facility_slug VARCHAR(180) NOT NULL UNIQUE,
    facility_icon VARCHAR(255),
    description VARCHAR(500),
    display_order SMALLINT UNSIGNED DEFAULT 1,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_facilities_category
        FOREIGN KEY (room_facility_category_id)
        REFERENCES room_facility_categories(room_facility_category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_room_facility_slug (facility_slug),
    INDEX idx_room_facility_category (room_facility_category_id),
    INDEX idx_room_facility_active (is_active)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meal_plans (

    meal_plan_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    meal_plan_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    meal_plan_name VARCHAR(100)
        NOT NULL UNIQUE,

    meal_plan_slug VARCHAR(120)
        NOT NULL UNIQUE,

    short_name VARCHAR(30),

    description VARCHAR(500),

    breakfast_included BOOLEAN
        DEFAULT FALSE,

    lunch_included BOOLEAN
        DEFAULT FALSE,

    dinner_included BOOLEAN
        DEFAULT FALSE,

    snacks_included BOOLEAN
        DEFAULT FALSE,

    beverages_included BOOLEAN
        DEFAULT FALSE,

    alcoholic_beverages_included BOOLEAN
        DEFAULT FALSE,

    breakfast_type ENUM(
        'None',
        'Continental',
        'Buffet',
        'A La Carte',
        'Full Breakfast'
    ) DEFAULT 'None',

    meal_serving_type ENUM(
        'None',
        'Restaurant',
        'Room Service',
        'Buffet',
        'Mixed'
    ) DEFAULT 'None',

    is_all_inclusive BOOLEAN
        DEFAULT FALSE,

    is_complimentary BOOLEAN
        DEFAULT TRUE,

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_meal_plan_slug (
        meal_plan_slug
    ),

    INDEX idx_meal_plan_active (
        is_active
    ),

    INDEX idx_meal_plan_all_inclusive (
        is_all_inclusive
    )
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

/* =============================================================================
   SECTION 4: CORE PROPERTY ENTITY
   ============================================================================= */

/* =============================================================================
   SECTION 4: CORE PROPERTY ENTITY
   ============================================================================= */

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
    starting_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

/* =============================================================================
   SECTION 5: PROPERTY CHILD & DETAIL TABLES
   ============================================================================= */

/* =============================================================================
   SECTION 5: PROPERTY CHILD & DETAIL TABLES
   ============================================================================= */

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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_contacts (

    contact_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    contact_uuid CHAR(36)
        NOT NULL DEFAULT(UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    contact_type_id SMALLINT UNSIGNED NOT NULL,

    contact_name VARCHAR(150) NOT NULL,

    designation VARCHAR(100),

    mobile_number VARCHAR(20),

    alternate_number VARCHAR(20),

    whatsapp_number VARCHAR(20),

    email VARCHAR(255),

    website VARCHAR(255),

    is_primary BOOLEAN DEFAULT FALSE,

    status BOOLEAN DEFAULT TRUE,

    delete_status TINYINT DEFAULT 0,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_contact_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id),

    CONSTRAINT fk_contact_type
        FOREIGN KEY(contact_type_id)
        REFERENCES contact_types(contact_type_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_images (

    image_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    image_uuid CHAR(36)
        NOT NULL DEFAULT(UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    image_type_id SMALLINT UNSIGNED NOT NULL,

    image_title VARCHAR(255),

    image_alt_text VARCHAR(255),

    storage_provider VARCHAR(50) DEFAULT 'AWS_S3',

    storage_bucket VARCHAR(255),

    storage_key VARCHAR(500),

    cdn_url VARCHAR(500),

    thumbnail_url VARCHAR(500),

    mime_type VARCHAR(100),

    file_extension VARCHAR(20),

    file_size BIGINT,

    image_width INT,

    image_height INT,

    image_order SMALLINT DEFAULT 1,

    is_cover_image BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    uploaded_by BIGINT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_property_image
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id),

    CONSTRAINT fk_image_type
        FOREIGN KEY(image_type_id)
        REFERENCES property_image_types(image_type_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_amenities (

    property_id BIGINT UNSIGNED,

    amenity_id BIGINT UNSIGNED,

    is_available BOOLEAN DEFAULT TRUE,

    remarks VARCHAR(255),

    created_by BIGINT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(property_id, amenity_id),

    CONSTRAINT fk_pa_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id),

    CONSTRAINT fk_pa_amenity
        FOREIGN KEY(amenity_id)
        REFERENCES amenities(amenity_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_highlights (

    highlight_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    highlight_uuid CHAR(36)
        NOT NULL DEFAULT(UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    highlight_title VARCHAR(150) NOT NULL,

    highlight_description VARCHAR(500),

    highlight_icon VARCHAR(255),

    display_order SMALLINT DEFAULT 1,

    status BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_highlight_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_tags (

    property_id BIGINT UNSIGNED,

    tag_id BIGINT UNSIGNED,

    created_by BIGINT UNSIGNED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(property_id, tag_id),

    CONSTRAINT fk_pt_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id),

    CONSTRAINT fk_pt_tag
        FOREIGN KEY(tag_id)
        REFERENCES tags(tag_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_policies (

    policy_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    policy_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL UNIQUE,

    /* =====================================================
       CHECK-IN / CHECK-OUT
    ====================================================== */

    check_in_from TIME NOT NULL DEFAULT '12:00:00',

    check_in_to TIME DEFAULT '23:59:59',

    check_out_from TIME DEFAULT '00:00:00',

    check_out_to TIME NOT NULL DEFAULT '10:00:00',

    early_checkin_allowed BOOLEAN DEFAULT FALSE,

    late_checkout_allowed BOOLEAN DEFAULT FALSE,

    early_checkin_fee DECIMAL(10,2) DEFAULT 0.00,

    late_checkout_fee DECIMAL(10,2) DEFAULT 0.00,

    /* =====================================================
       CANCELLATION
    ====================================================== */

    cancellation_policy TEXT,

    free_cancellation_hours SMALLINT,

    refund_policy TEXT,

    no_show_policy TEXT,

    /* =====================================================
       GUEST POLICIES
    ====================================================== */

    id_proof_required BOOLEAN DEFAULT TRUE,

    accepted_id_proofs JSON,

    unmarried_couples_allowed BOOLEAN DEFAULT TRUE,

    local_ids_allowed BOOLEAN DEFAULT TRUE,

    foreign_guests_allowed BOOLEAN DEFAULT TRUE,

    /* =====================================================
       CHILD POLICY
    ====================================================== */

    child_policy TEXT,

    children_allowed BOOLEAN DEFAULT TRUE,

    child_age_limit TINYINT DEFAULT 6,

    extra_bed_available BOOLEAN DEFAULT FALSE,

    extra_bed_charge DECIMAL(10,2) DEFAULT 0.00,

    /* =====================================================
       PET POLICY
    ====================================================== */

    pets_allowed BOOLEAN DEFAULT FALSE,

    pet_policy TEXT,

    pet_charges DECIMAL(10,2) DEFAULT 0.00,

    /* =====================================================
       SMOKING / ALCOHOL
    ====================================================== */

    smoking_allowed BOOLEAN DEFAULT FALSE,

    smoking_policy TEXT,

    alcohol_allowed BOOLEAN DEFAULT TRUE,

    alcohol_policy TEXT,

    /* =====================================================
       FOOD
    ====================================================== */

    outside_food_allowed BOOLEAN DEFAULT TRUE,

    outside_food_policy TEXT,

    /* =====================================================
       VISITORS
    ====================================================== */

    visitors_allowed BOOLEAN DEFAULT TRUE,

    visitor_policy TEXT,

    /* =====================================================
       PARTIES
    ====================================================== */

    parties_allowed BOOLEAN DEFAULT FALSE,

    party_policy TEXT,

    /* =====================================================
       QUIET HOURS
    ====================================================== */

    quiet_hours_start TIME,

    quiet_hours_end TIME,

    /* =====================================================
       PARKING
    ====================================================== */

    parking_available BOOLEAN DEFAULT FALSE,

    parking_policy TEXT,

    parking_charges DECIMAL(10,2) DEFAULT 0.00,

    /* =====================================================
       INTERNET
    ====================================================== */

    wifi_available BOOLEAN DEFAULT TRUE,

    wifi_policy TEXT,

    /* =====================================================
       DAMAGE / SECURITY
    ====================================================== */

    security_deposit_required BOOLEAN DEFAULT FALSE,

    security_deposit_amount DECIMAL(12,2) DEFAULT 0.00,

    damage_policy TEXT,

    /* =====================================================
       PAYMENT
    ====================================================== */

    pay_at_property BOOLEAN DEFAULT FALSE,

    prepaid_booking BOOLEAN DEFAULT TRUE,

    accepted_payment_methods JSON,

    /* =====================================================
       GENERAL
    ====================================================== */

    important_information TEXT,

    checkin_instructions TEXT,

    checkout_instructions TEXT,

    house_manual TEXT,

    emergency_contact VARCHAR(20),

    /* =====================================================
       STATUS
    ====================================================== */

    is_active BOOLEAN DEFAULT TRUE,

    delete_status BOOLEAN DEFAULT FALSE,

    /* =====================================================
       AUDIT
    ====================================================== */

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    /* =====================================================
       FOREIGN KEY
    ====================================================== */

    CONSTRAINT fk_property_policy_property
        FOREIGN KEY (property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    /* =====================================================
       INDEXES
    ====================================================== */

    INDEX idx_property_policy_property(property_id),

    INDEX idx_property_policy_status(is_active),

    INDEX idx_property_policy_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_house_rules (

    rule_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    rule_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    rule_category_id SMALLINT UNSIGNED NOT NULL,

    rule_title VARCHAR(200) NOT NULL,

    rule_description TEXT,

    rule_icon VARCHAR(255),

    display_order SMALLINT DEFAULT 1,

    is_mandatory BOOLEAN DEFAULT FALSE,

    is_highlight BOOLEAN DEFAULT FALSE,

    applies_to_children BOOLEAN DEFAULT FALSE,

    applies_to_pets BOOLEAN DEFAULT FALSE,

    applies_to_visitors BOOLEAN DEFAULT FALSE,

    penalty_amount DECIMAL(12,2) DEFAULT 0.00,

    penalty_description VARCHAR(255),

    effective_from DATE,

    effective_to DATE,

    is_active BOOLEAN DEFAULT TRUE,

    delete_status BOOLEAN DEFAULT FALSE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_house_rule_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_house_rule_category
        FOREIGN KEY(rule_category_id)
        REFERENCES property_house_rule_categories(rule_category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_property(property_id),

    INDEX idx_category(rule_category_id),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status),

    INDEX idx_display(display_order)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_nearby_places (

    nearby_place_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nearby_place_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    nearby_place_type_id SMALLINT UNSIGNED NOT NULL,

    place_name VARCHAR(255) NOT NULL,

    place_description VARCHAR(500),

    distance DECIMAL(8,2) NOT NULL,

    distance_unit ENUM(
        'Meters',
        'Kilometers'
    ) DEFAULT 'Kilometers',

    travel_time_minutes SMALLINT UNSIGNED,

    travel_mode ENUM(
        'Walking',
        'Driving',
        'Cycling',
        'Public Transport',
        'Boat',
        'Other'
    ) DEFAULT 'Driving',

    latitude DECIMAL(10,8),

    longitude DECIMAL(11,8),

    google_place_id VARCHAR(255),

    google_map_url VARCHAR(500),

    is_featured BOOLEAN DEFAULT FALSE,

    display_order SMALLINT UNSIGNED DEFAULT 1,

    is_active BOOLEAN DEFAULT TRUE,

    remarks VARCHAR(500),

    delete_status BOOLEAN DEFAULT FALSE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_nearby_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_nearby_place_type
        FOREIGN KEY(nearby_place_type_id)
        REFERENCES nearby_place_types(nearby_place_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_property(property_id),

    INDEX idx_place_type(nearby_place_type_id),

    INDEX idx_distance(distance),

    INDEX idx_featured(is_featured),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status),

    INDEX idx_display(display_order),

    INDEX idx_coordinates(latitude, longitude)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_statistics (

    statistics_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    statistics_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL UNIQUE,

    /* =====================================================
       PROPERTY VIEWS
    ====================================================== */

    total_views BIGINT UNSIGNED DEFAULT 0,

    today_views INT UNSIGNED DEFAULT 0,

    weekly_views INT UNSIGNED DEFAULT 0,

    monthly_views INT UNSIGNED DEFAULT 0,

    yearly_views INT UNSIGNED DEFAULT 0,

    unique_visitors BIGINT UNSIGNED DEFAULT 0,

    /* =====================================================
       SEARCH PERFORMANCE
    ====================================================== */

    search_impressions BIGINT UNSIGNED DEFAULT 0,

    search_clicks BIGINT UNSIGNED DEFAULT 0,

    search_ctr DECIMAL(5,2) DEFAULT 0.00,

    average_search_position DECIMAL(5,2) DEFAULT 0.00,

    /* =====================================================
       BOOKINGS
    ====================================================== */

    total_bookings BIGINT UNSIGNED DEFAULT 0,

    confirmed_bookings BIGINT UNSIGNED DEFAULT 0,

    cancelled_bookings BIGINT UNSIGNED DEFAULT 0,

    completed_bookings BIGINT UNSIGNED DEFAULT 0,

    pending_bookings BIGINT UNSIGNED DEFAULT 0,

    no_show_bookings BIGINT UNSIGNED DEFAULT 0,

    /* =====================================================
       REVENUE
    ====================================================== */

    total_revenue DECIMAL(15,2) DEFAULT 0.00,

    monthly_revenue DECIMAL(15,2) DEFAULT 0.00,

    yearly_revenue DECIMAL(15,2) DEFAULT 0.00,

    average_booking_value DECIMAL(15,2) DEFAULT 0.00,

    /* =====================================================
       OCCUPANCY
    ====================================================== */

    occupancy_rate DECIMAL(5,2) DEFAULT 0.00,

    average_stay_nights DECIMAL(5,2) DEFAULT 0.00,

    total_room_nights BIGINT UNSIGNED DEFAULT 0,

    occupied_room_nights BIGINT UNSIGNED DEFAULT 0,

    available_room_nights BIGINT UNSIGNED DEFAULT 0,

    /* =====================================================
       RATINGS
    ====================================================== */

    average_rating DECIMAL(3,2) DEFAULT 0.00,

    total_reviews INT UNSIGNED DEFAULT 0,

    five_star_reviews INT UNSIGNED DEFAULT 0,

    four_star_reviews INT UNSIGNED DEFAULT 0,

    three_star_reviews INT UNSIGNED DEFAULT 0,

    two_star_reviews INT UNSIGNED DEFAULT 0,

    one_star_reviews INT UNSIGNED DEFAULT 0,

    /* =====================================================
       CUSTOMER ENGAGEMENT
    ====================================================== */

    wishlist_count INT UNSIGNED DEFAULT 0,

    share_count INT UNSIGNED DEFAULT 0,

    enquiry_count INT UNSIGNED DEFAULT 0,

    repeat_guest_count INT UNSIGNED DEFAULT 0,

    /* =====================================================
       LAST ACTIVITY
    ====================================================== */

    last_booking_at DATETIME,

    last_viewed_at DATETIME,

    last_reviewed_at DATETIME,

    last_updated_statistics_at DATETIME,

    /* =====================================================
       STATUS
    ====================================================== */

    is_active BOOLEAN DEFAULT TRUE,

    delete_status BOOLEAN DEFAULT FALSE,

    /* =====================================================
       AUDIT
    ====================================================== */

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    /* =====================================================
       FOREIGN KEY
    ====================================================== */

    CONSTRAINT fk_property_statistics_property
        FOREIGN KEY (property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    /* =====================================================
       INDEXES
    ====================================================== */

    INDEX idx_property(property_id),

    INDEX idx_rating(average_rating),

    INDEX idx_bookings(total_bookings),

    INDEX idx_revenue(total_revenue),

    INDEX idx_views(total_views),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_documents (

    document_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    document_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    document_type_id SMALLINT UNSIGNED NOT NULL,

    document_number VARCHAR(150),

    document_title VARCHAR(255),

    document_description VARCHAR(500),

    /* =====================================================
       FILE INFORMATION
    ====================================================== */

    original_file_name VARCHAR(255) NOT NULL,

    stored_file_name VARCHAR(255) NOT NULL,

    file_extension VARCHAR(20),

    mime_type VARCHAR(100),

    file_size BIGINT UNSIGNED,

    storage_provider ENUM(

        'LOCAL',

        'AWS_S3',

        'AZURE_BLOB',

        'GOOGLE_CLOUD'

    ) DEFAULT 'AWS_S3',

    storage_bucket VARCHAR(255),

    storage_path VARCHAR(500),

    cdn_url VARCHAR(500),

    thumbnail_url VARCHAR(500),

    checksum_sha256 VARCHAR(64),

    /* =====================================================
       VALIDITY
    ====================================================== */

    issue_date DATE,

    expiry_date DATE,

    issued_by VARCHAR(255),

    issuing_authority VARCHAR(255),

    /* =====================================================
       VERIFICATION
    ====================================================== */

    verification_status ENUM(

        'Pending',

        'Under Review',

        'Verified',

        'Rejected',

        'Expired'

    ) DEFAULT 'Pending',

    verified_by BIGINT UNSIGNED,

    verified_at DATETIME,

    rejection_reason TEXT,

    verification_notes TEXT,

    /* =====================================================
       VERSION CONTROL
    ====================================================== */

    version_number SMALLINT UNSIGNED DEFAULT 1,

    previous_document_id BIGINT UNSIGNED,

    is_latest_version BOOLEAN DEFAULT TRUE,

    /* =====================================================
       STATUS
    ====================================================== */

    is_active BOOLEAN DEFAULT TRUE,

    delete_status BOOLEAN DEFAULT FALSE,

    remarks TEXT,

    /* =====================================================
       AUDIT
    ====================================================== */

    uploaded_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    /* =====================================================
       FOREIGN KEYS
    ====================================================== */

    CONSTRAINT fk_property_document_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_property_document_type
        FOREIGN KEY(document_type_id)
        REFERENCES document_types(document_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_property_document_previous
        FOREIGN KEY(previous_document_id)
        REFERENCES property_documents(document_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_property_document_verified_by
        FOREIGN KEY(verified_by)
        REFERENCES admin(admin_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    /* =====================================================
       INDEXES
    ====================================================== */

    INDEX idx_property(property_id),

    INDEX idx_document_type(document_type_id),

    INDEX idx_status(verification_status),

    INDEX idx_expiry(expiry_date),

    INDEX idx_active(is_active),

    INDEX idx_latest(is_latest_version),

    INDEX idx_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_languages (

    property_language_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    property_language_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    language_id SMALLINT UNSIGNED NOT NULL,

    language_type ENUM(

        'Staff',

        'Reception',

        'Support',

        'Guide',

        'Manager',

        'Website',

        'Other'

    ) DEFAULT 'Staff',

    proficiency_level ENUM(

        'Basic',

        'Intermediate',

        'Fluent',

        'Native'

    ) DEFAULT 'Fluent',

    is_primary BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    remarks VARCHAR(500),

    delete_status BOOLEAN DEFAULT FALSE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_property_language_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_property_language_language
        FOREIGN KEY(language_id)
        REFERENCES languages(language_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uq_property_language
    (
        property_id,
        language_id,
        language_type
    ),

    INDEX idx_property(property_id),

    INDEX idx_language(language_id),

    INDEX idx_primary(is_primary),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

/* =============================================================================
   SECTION 6: ROOMS & ROOM CHILD TABLES
   ============================================================================= */

/* =============================================================================
   SECTION 6: ROOMS & ROOM CHILD TABLES
   ============================================================================= */

CREATE TABLE IF NOT EXISTS rooms (

    room_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    room_type_id SMALLINT UNSIGNED NOT NULL,

    room_status_id SMALLINT UNSIGNED NOT NULL,

    room_view_id SMALLINT UNSIGNED,

    room_name VARCHAR(150) NOT NULL,

    room_code VARCHAR(50) NOT NULL,

    room_slug VARCHAR(180) NOT NULL,

    room_number VARCHAR(50),

    internal_reference VARCHAR(100),

    description TEXT,

    short_description VARCHAR(500),

    room_area DECIMAL(8,2),

    room_area_unit ENUM(

        'Sq.ft',

        'Sq.m'

    ) DEFAULT 'Sq.ft',

    floor_number SMALLINT,

    maximum_adults TINYINT UNSIGNED DEFAULT 2,

    maximum_children TINYINT UNSIGNED DEFAULT 0,

    maximum_guests TINYINT UNSIGNED DEFAULT 2,

    base_occupancy TINYINT UNSIGNED DEFAULT 2,

    minimum_occupancy TINYINT UNSIGNED DEFAULT 1,

    bathrooms TINYINT UNSIGNED DEFAULT 1,

    balconies TINYINT UNSIGNED DEFAULT 0,

    bedrooms TINYINT UNSIGNED DEFAULT 1,

    living_rooms TINYINT UNSIGNED DEFAULT 0,

    kitchens TINYINT UNSIGNED DEFAULT 0,

    smoking_allowed BOOLEAN DEFAULT FALSE,

    pets_allowed BOOLEAN DEFAULT FALSE,

    extra_bed_allowed BOOLEAN DEFAULT FALSE,

    extra_bed_count TINYINT UNSIGNED DEFAULT 0,

    extra_bed_price DECIMAL(10,2) DEFAULT 0.00,

    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    discount_price DECIMAL(10,2) NULL DEFAULT NULL,

    extra_adult_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    extra_child_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    breakfast_included BOOLEAN DEFAULT FALSE,

    air_conditioned BOOLEAN DEFAULT TRUE,

    soundproof BOOLEAN DEFAULT FALSE,

    wheelchair_accessible BOOLEAN DEFAULT FALSE,

    housekeeping_available BOOLEAN DEFAULT TRUE,

    housekeeping_frequency ENUM(

        'Daily',

        'Alternate',

        'Weekly',

        'On Request'

    ) DEFAULT 'Daily',

    room_size_category ENUM(

        'Small',

        'Medium',

        'Large',

        'Extra Large'

    ) DEFAULT 'Medium',

    room_condition ENUM(

        'Excellent',

        'Good',

        'Needs Maintenance',

        'Out Of Service'

    ) DEFAULT 'Excellent',

    sort_order SMALLINT DEFAULT 1,

    is_featured BOOLEAN DEFAULT FALSE,

    is_published BOOLEAN DEFAULT TRUE,

    is_bookable BOOLEAN DEFAULT TRUE,

    is_active BOOLEAN DEFAULT TRUE,

    delete_status BOOLEAN DEFAULT FALSE,

    remarks TEXT,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_room_property
        FOREIGN KEY(property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_room_type
        FOREIGN KEY(room_type_id)
        REFERENCES room_types(room_type_id)
        ON UPDATE CASCADE,

    CONSTRAINT fk_room_status
        FOREIGN KEY(room_status_id)
        REFERENCES room_status(room_status_id)
        ON UPDATE CASCADE,

    CONSTRAINT fk_room_view
        FOREIGN KEY(room_view_id)
        REFERENCES room_views(room_view_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    UNIQUE KEY uq_property_room_code
    (
        property_id,
        room_code
    ),

    UNIQUE KEY uq_property_room_number
    (
        property_id,
        room_number
    ),

    INDEX idx_property(property_id),

    INDEX idx_room_type(room_type_id),

    INDEX idx_room_status(room_status_id),

    INDEX idx_room_view(room_view_id),

    INDEX idx_room_slug(room_slug),

    INDEX idx_room_bookable(is_bookable),

    INDEX idx_room_featured(is_featured),

    INDEX idx_room_published(is_published),

    INDEX idx_room_active(is_active),

    INDEX idx_room_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_images (

    room_image_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_image_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    room_id BIGINT UNSIGNED NOT NULL,

    room_image_type_id SMALLINT UNSIGNED NOT NULL,

    image_title VARCHAR(255),

    image_description VARCHAR(500),

    image_alt_text VARCHAR(255),

    image_caption VARCHAR(255),

    /* =====================================================
       FILE DETAILS
    ====================================================== */

    original_file_name VARCHAR(255) NOT NULL,

    stored_file_name VARCHAR(255) NOT NULL,

    file_extension VARCHAR(20),

    mime_type VARCHAR(100),

    file_size BIGINT UNSIGNED,

    image_width INT UNSIGNED,

    image_height INT UNSIGNED,

    aspect_ratio VARCHAR(20),

    /* =====================================================
       STORAGE
    ====================================================== */

    storage_provider ENUM(

        'LOCAL',

        'AWS_S3',

        'AZURE_BLOB',

        'GOOGLE_CLOUD'

    ) DEFAULT 'AWS_S3',

    storage_bucket VARCHAR(255),

    storage_path VARCHAR(500),

    cdn_url VARCHAR(500) NOT NULL,

    thumbnail_url VARCHAR(500),

    webp_url VARCHAR(500),

    avif_url VARCHAR(500),

    /* =====================================================
       IMAGE FLAGS
    ====================================================== */

    is_cover_image BOOLEAN DEFAULT FALSE,

    is_featured BOOLEAN DEFAULT FALSE,

    is_primary BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    display_order SMALLINT UNSIGNED DEFAULT 1,

    /* =====================================================
       SEO
    ====================================================== */

    image_tags VARCHAR(500),

    /* =====================================================
       AUDIT
    ====================================================== */

    uploaded_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    delete_status BOOLEAN DEFAULT FALSE,

    remarks TEXT,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    /* =====================================================
       FOREIGN KEYS
    ====================================================== */

    CONSTRAINT fk_room_image_room
        FOREIGN KEY(room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_room_image_type
        FOREIGN KEY(room_image_type_id)
        REFERENCES room_image_types(room_image_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    /* =====================================================
       INDEXES
    ====================================================== */

    INDEX idx_room(room_id),

    INDEX idx_room_image_type(room_image_type_id),

    INDEX idx_cover(is_cover_image),

    INDEX idx_primary(is_primary),

    INDEX idx_featured(is_featured),

    INDEX idx_display(display_order),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_beds (

    room_bed_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_bed_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    room_id BIGINT UNSIGNED NOT NULL,

    bed_type_id SMALLINT UNSIGNED NOT NULL,

    quantity TINYINT UNSIGNED
        NOT NULL DEFAULT 1,

    bed_position ENUM(

        'Primary',

        'Secondary',

        'Extra',

        'Optional'

    ) DEFAULT 'Primary',

    is_default BOOLEAN
        DEFAULT FALSE,

    is_extra_bed BOOLEAN
        DEFAULT FALSE,

    additional_charge DECIMAL(10,2)
        DEFAULT 0.00,

    remarks VARCHAR(500),

    is_active BOOLEAN
        DEFAULT TRUE,

    delete_status BOOLEAN
        DEFAULT FALSE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_room_beds_room
        FOREIGN KEY(room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_room_beds_bed_type
        FOREIGN KEY(bed_type_id)
        REFERENCES bed_types(bed_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uq_room_bed
    (
        room_id,
        bed_type_id,
        bed_position
    ),

    INDEX idx_room(room_id),

    INDEX idx_bed_type(bed_type_id),

    INDEX idx_default(is_default),

    INDEX idx_extra(is_extra_bed),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_amenities (

    room_amenity_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_amenity_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    room_id BIGINT UNSIGNED NOT NULL,

    amenity_id BIGINT UNSIGNED NOT NULL,

    is_available BOOLEAN
        DEFAULT TRUE,

    is_complimentary BOOLEAN
        DEFAULT TRUE,

    additional_charge DECIMAL(10,2)
        DEFAULT 0.00,

    quantity SMALLINT UNSIGNED
        DEFAULT 1,

    remarks VARCHAR(500),

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_active BOOLEAN
        DEFAULT TRUE,

    delete_status BOOLEAN
        DEFAULT FALSE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_room_amenity_room
        FOREIGN KEY(room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_room_amenity_master
        FOREIGN KEY(amenity_id)
        REFERENCES amenities(amenity_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uq_room_amenity
    (
        room_id,
        amenity_id
    ),

    INDEX idx_room(room_id),

    INDEX idx_amenity(amenity_id),

    INDEX idx_available(is_available),

    INDEX idx_complimentary(is_complimentary),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_facilities_mapping (

    room_facility_mapping_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_facility_mapping_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    room_id BIGINT UNSIGNED NOT NULL,

    room_facility_id BIGINT UNSIGNED NOT NULL,

    facility_value VARCHAR(255),

    is_available BOOLEAN
        DEFAULT TRUE,

    is_complimentary BOOLEAN
        DEFAULT TRUE,

    additional_charge DECIMAL(10,2)
        DEFAULT 0.00,

    remarks VARCHAR(500),

    display_order SMALLINT UNSIGNED
        DEFAULT 1,

    is_active BOOLEAN
        DEFAULT TRUE,

    delete_status BOOLEAN
        DEFAULT FALSE,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_room_facility_mapping_room
        FOREIGN KEY(room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_room_facility_mapping_facility
        FOREIGN KEY(room_facility_id)
        REFERENCES room_facilities(room_facility_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uq_room_facility
    (
        room_id,
        room_facility_id
    ),

    INDEX idx_room(room_id),

    INDEX idx_facility(room_facility_id),

    INDEX idx_available(is_available),

    INDEX idx_active(is_active),

    INDEX idx_delete(delete_status)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

/* =============================================================================
   SECTION 7: INVENTORY, CALENDAR & BOOKING CONTROLS
   ============================================================================= */

CREATE TABLE IF NOT EXISTS room_inventory (

    inventory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    inventory_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    room_id BIGINT UNSIGNED NOT NULL,

    property_id BIGINT UNSIGNED NOT NULL,

    inventory_code VARCHAR(100) NOT NULL,

    total_units INT UNSIGNED NOT NULL DEFAULT 1,

    sellable_units INT UNSIGNED NOT NULL DEFAULT 1,

    minimum_stock INT UNSIGNED NOT NULL DEFAULT 0,

    maximum_stock INT UNSIGNED,

    overbooking_allowed BOOLEAN DEFAULT FALSE,

    overbooking_limit SMALLINT UNSIGNED DEFAULT 0,

    inventory_mode ENUM(
        'Room Based',
        'Unit Based'
    ) DEFAULT 'Room Based',

    allocation_mode ENUM(
        'Automatic',
        'Manual',
        'Hybrid'
    ) DEFAULT 'Automatic',

    sync_status ENUM(
        'Not Synced',
        'Synced',
        'Syncing',
        'Failed'
    ) DEFAULT 'Not Synced',

    last_synced_at DATETIME,

    sync_error_message VARCHAR(500),

    is_active BOOLEAN DEFAULT TRUE,

    delete_status BOOLEAN DEFAULT FALSE,

    remarks VARCHAR(500),

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    deleted_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_inventory_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_property
        FOREIGN KEY (property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    UNIQUE KEY uq_inventory_room (
        room_id
    ),

    UNIQUE KEY uq_inventory_code (
        property_id,
        inventory_code
    ),

    INDEX idx_inventory_property (
        property_id
    ),

    INDEX idx_inventory_room (
        room_id
    ),

    INDEX idx_inventory_active (
        is_active
    ),

    INDEX idx_inventory_delete (
        delete_status
    ),

    INDEX idx_inventory_sync (
        sync_status
    )
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_calendar (

    inventory_calendar_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    inventory_calendar_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    inventory_id BIGINT UNSIGNED NOT NULL,

    room_id BIGINT UNSIGNED NOT NULL,

    property_id BIGINT UNSIGNED NOT NULL,

    inventory_date DATE NOT NULL,

    /* =====================================================
       INVENTORY QUANTITY
    ====================================================== */

    total_units INT UNSIGNED NOT NULL DEFAULT 0,

    available_units INT UNSIGNED NOT NULL DEFAULT 0,

    booked_units INT UNSIGNED NOT NULL DEFAULT 0,

    blocked_units INT UNSIGNED NOT NULL DEFAULT 0,

    maintenance_units INT UNSIGNED NOT NULL DEFAULT 0,

    stop_sell_units INT UNSIGNED NOT NULL DEFAULT 0,

    /* =====================================================
       BOOKING CONTROL
    ====================================================== */

    minimum_available_units INT UNSIGNED DEFAULT 0,

    maximum_sellable_units INT UNSIGNED,

    overbooking_units INT UNSIGNED DEFAULT 0,

    is_sellable BOOLEAN DEFAULT TRUE,

    is_available BOOLEAN DEFAULT TRUE,

    /* =====================================================
       ARRIVAL / DEPARTURE CONTROL
    ====================================================== */

    closed_for_arrival BOOLEAN DEFAULT FALSE,

    closed_for_departure BOOLEAN DEFAULT FALSE,

    daily_price DECIMAL(10,2) NULL DEFAULT NULL,

    daily_discount_price DECIMAL(10,2) NULL DEFAULT NULL,

    minimum_stay_nights SMALLINT UNSIGNED DEFAULT 1,

    maximum_stay_nights SMALLINT UNSIGNED,

    /* =====================================================
       INVENTORY STATUS
    ====================================================== */

    inventory_status ENUM(

        'Available',

        'Limited',

        'Sold Out',

        'Blocked',

        'Maintenance',

        'Stop Sell'

    ) DEFAULT 'Available',

    /* =====================================================
       CHANNEL / OTA SYNC
    ====================================================== */

    channel_sync_required BOOLEAN DEFAULT FALSE,

    last_synced_at DATETIME,

    /* =====================================================
       AUDIT
    ====================================================== */

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    /* =====================================================
       FOREIGN KEYS
    ====================================================== */

    CONSTRAINT fk_inventory_calendar_inventory

        FOREIGN KEY (inventory_id)

        REFERENCES room_inventory(inventory_id)

        ON UPDATE CASCADE

        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_calendar_room

        FOREIGN KEY (room_id)

        REFERENCES rooms(room_id)

        ON UPDATE CASCADE

        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_calendar_property

        FOREIGN KEY (property_id)

        REFERENCES properties(property_id)

        ON UPDATE CASCADE

        ON DELETE CASCADE,

    /* =====================================================
       UNIQUE DATE RECORD
    ====================================================== */

    UNIQUE KEY uq_inventory_calendar_date (

        inventory_id,

        inventory_date

    ),

    /* =====================================================
       INDEXES
    ====================================================== */

    INDEX idx_calendar_property (

        property_id

    ),

    INDEX idx_calendar_room (

        room_id

    ),

    INDEX idx_calendar_date (

        inventory_date

    ),

    INDEX idx_calendar_availability (

        inventory_date,

        is_available

    ),

    INDEX idx_calendar_sellable (

        inventory_date,

        is_sellable

    ),

    INDEX idx_calendar_status (

        inventory_status

    )
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_transactions (

    inventory_transaction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    inventory_transaction_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    inventory_id BIGINT UNSIGNED NOT NULL,

    inventory_calendar_id BIGINT UNSIGNED,

    property_id BIGINT UNSIGNED NOT NULL,

    room_id BIGINT UNSIGNED NOT NULL,

    transaction_date DATE NOT NULL,

    transaction_type ENUM(

        'Opening Balance',

        'Booking',

        'Cancellation',

        'Modification',

        'Check-in',

        'Check-out',

        'Room Block',

        'Block Release',

        'Maintenance',

        'Maintenance Release',

        'Stop Sell',

        'Stop Sell Release',

        'Manual Adjustment',

        'Inventory Increase',

        'Inventory Decrease',

        'System Correction',

        'Overbooking'

    ) NOT NULL,

    transaction_direction ENUM(
        'Increase',
        'Decrease'
    ) NOT NULL,

    quantity INT UNSIGNED NOT NULL DEFAULT 1,

    previous_available_units INT UNSIGNED NOT NULL DEFAULT 0,

    new_available_units INT UNSIGNED NOT NULL DEFAULT 0,

    previous_booked_units INT UNSIGNED NOT NULL DEFAULT 0,

    new_booked_units INT UNSIGNED NOT NULL DEFAULT 0,

    previous_blocked_units INT UNSIGNED NOT NULL DEFAULT 0,

    new_blocked_units INT UNSIGNED NOT NULL DEFAULT 0,

    previous_maintenance_units INT UNSIGNED NOT NULL DEFAULT 0,

    new_maintenance_units INT UNSIGNED NOT NULL DEFAULT 0,

    previous_stop_sell_units INT UNSIGNED NOT NULL DEFAULT 0,

    new_stop_sell_units INT UNSIGNED NOT NULL DEFAULT 0,

    reference_type VARCHAR(50),

    reference_id BIGINT UNSIGNED,

    reference_uuid CHAR(36),

    reason VARCHAR(500),

    remarks TEXT,

    source ENUM(

        'System',

        'Booking',

        'Admin',

        'Property Owner',

        'Channel Manager',

        'API',

        'Migration'

    ) DEFAULT 'System',

    performed_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_transaction_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES room_inventory(inventory_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_transaction_calendar
        FOREIGN KEY (inventory_calendar_id)
        REFERENCES inventory_calendar(inventory_calendar_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_inventory_transaction_property
        FOREIGN KEY (property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_transaction_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_transaction_inventory (
        inventory_id
    ),

    INDEX idx_transaction_calendar (
        inventory_calendar_id
    ),

    INDEX idx_transaction_property (
        property_id
    ),

    INDEX idx_transaction_room (
        room_id
    ),

    INDEX idx_transaction_date (
        transaction_date
    ),

    INDEX idx_transaction_type (
        transaction_type
    ),

    INDEX idx_transaction_reference (
        reference_type,
        reference_id
    ),

    INDEX idx_transaction_created (
        created_at
    )
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_blocks (

    room_block_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    room_block_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    room_id BIGINT UNSIGNED NOT NULL,

    inventory_id BIGINT UNSIGNED,

    block_reference VARCHAR(100),

    block_type ENUM(
        'Owner Use',
        'Maintenance',
        'Renovation',
        'VIP Allocation',
        'Group Allocation',
        'Operational',
        'Private Event',
        'Safety',
        'Other'
    ) NOT NULL DEFAULT 'Operational',

    block_reason VARCHAR(500),

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    blocked_units INT UNSIGNED NOT NULL DEFAULT 1,

    release_automatically BOOLEAN DEFAULT FALSE,

    status ENUM(
        'Scheduled',
        'Active',
        'Released',
        'Cancelled'
    ) NOT NULL DEFAULT 'Scheduled',

    affects_inventory BOOLEAN DEFAULT TRUE,

    affects_booking BOOLEAN DEFAULT TRUE,

    affects_checkin BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    released_by BIGINT UNSIGNED,

    cancelled_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    released_at DATETIME,

    cancelled_at DATETIME,

    CONSTRAINT fk_room_block_property
        FOREIGN KEY (property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_room_block_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_room_block_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES room_inventory(inventory_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_room_block_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_room_block_units
        CHECK (blocked_units > 0),

    INDEX idx_room_block_property (
        property_id
    ),

    INDEX idx_room_block_room (
        room_id
    ),

    INDEX idx_room_block_inventory (
        inventory_id
    ),

    INDEX idx_room_block_dates (
        start_date,
        end_date
    ),

    INDEX idx_room_block_status (
        status
    ),

    INDEX idx_room_block_type (
        block_type
    )
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stop_sell (

    stop_sell_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    stop_sell_uuid CHAR(36)
        NOT NULL DEFAULT (UUID()) UNIQUE,

    property_id BIGINT UNSIGNED NOT NULL,

    room_id BIGINT UNSIGNED,

    inventory_id BIGINT UNSIGNED,

    stop_sell_reference VARCHAR(100),

    stop_sell_type ENUM(
        'Property',
        'Room',
        'Room Type',
        'Channel',
        'Rate Plan',
        'Inventory'
    ) NOT NULL DEFAULT 'Room',

    reason_type ENUM(
        'Low Availability',
        'Operational',
        'Owner Request',
        'High Demand',
        'Maintenance',
        'System',
        'Channel Restriction',
        'Emergency',
        'Other'
    ) NOT NULL DEFAULT 'Operational',

    reason VARCHAR(500),

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    start_time TIME,

    end_time TIME,

    affects_new_bookings BOOLEAN DEFAULT TRUE,

    affects_modifications BOOLEAN DEFAULT FALSE,

    affects_existing_bookings BOOLEAN DEFAULT FALSE,

    affects_all_channels BOOLEAN DEFAULT TRUE,

    status ENUM(
        'Scheduled',
        'Active',
        'Released',
        'Cancelled'
    ) NOT NULL DEFAULT 'Scheduled',

    release_automatically BOOLEAN DEFAULT FALSE,

    released_by BIGINT UNSIGNED,

    released_at DATETIME,

    cancelled_by BIGINT UNSIGNED,

    cancelled_at DATETIME,

    remarks TEXT,

    created_by BIGINT UNSIGNED,

    updated_by BIGINT UNSIGNED,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_stop_sell_property
        FOREIGN KEY (property_id)
        REFERENCES properties(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_stop_sell_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_stop_sell_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES room_inventory(inventory_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_stop_sell_dates
        CHECK (end_date >= start_date),

    INDEX idx_stop_sell_property (
        property_id
    ),

    INDEX idx_stop_sell_room (
        room_id
    ),

    INDEX idx_stop_sell_inventory (
        inventory_id
    ),

    INDEX idx_stop_sell_dates (
        start_date,
        end_date
    ),

    INDEX idx_stop_sell_status (
        status
    ),

    INDEX idx_stop_sell_type (
        stop_sell_type
    )
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

/* =============================================================================
   SECTION 8: ROOM SEASONAL RATES & DYNAMIC PRICING
   ============================================================================= */

CREATE TABLE IF NOT EXISTS room_seasonal_rates (
    rate_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    property_id BIGINT UNSIGNED NOT NULL,
    rate_name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_price DECIMAL(10,2) NULL DEFAULT NULL,
    extra_adult_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    extra_child_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    days_of_week VARCHAR(100) NULL DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    delete_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_seasonal_rates_room FOREIGN KEY (room_id)
        REFERENCES rooms(room_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_seasonal_rates_property FOREIGN KEY (property_id)
        REFERENCES properties(property_id) ON DELETE CASCADE ON UPDATE CASCADE,
    KEY idx_room_seasonal_rates_room (room_id),
    KEY idx_room_seasonal_rates_property (property_id),
    KEY idx_room_seasonal_rates_dates (start_date, end_date),
    KEY idx_room_seasonal_rates_active (is_active, delete_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


/* =============================================================================
   SECTION 9: STAFF, ROLES & ENTERPRISE RBAC TABLES
   ============================================================================= */

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
    CONSTRAINT fk_employee_roles_owner FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON DELETE CASCADE ON UPDATE CASCADE,
    KEY idx_roles_owner (p_owner_id),
    KEY idx_roles_slug (role_slug),
    KEY idx_roles_system (is_system_role),
    KEY idx_roles_active_delete (is_active, delete_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id)
        REFERENCES employee_roles(role_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id)
        REFERENCES permissions(permission_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_employees_owner FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_employees_role FOREIGN KEY (role_id)
        REFERENCES employee_roles(role_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_employees_uuid (uuid),
    KEY idx_employees_owner (p_owner_id),
    KEY idx_employees_role (role_id),
    KEY idx_employees_email (email),
    KEY idx_employees_phone (phone),
    KEY idx_employees_status (status),
    KEY idx_employees_delete_status (delete_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_pe_property FOREIGN KEY (property_id)
        REFERENCES properties(property_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pe_employee FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_property_employee (property_id, employee_id),
    KEY idx_pe_property (property_id),
    KEY idx_pe_employee (employee_id),
    KEY idx_pe_status_delete (status, delete_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_employee_login_emp FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id) ON DELETE SET NULL ON UPDATE CASCADE,
    KEY idx_employee_logs_time (employee_id, created_at),
    KEY idx_employee_logs_email (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_emp_sessions_emp FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_emp_sessions_owner FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON DELETE CASCADE ON UPDATE CASCADE,
    KEY idx_emp_sessions_employee_id (employee_id),
    KEY idx_emp_sessions_p_owner_id (p_owner_id),
    KEY idx_emp_sessions_token_hash (token_hash),
    KEY idx_emp_sessions_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_audit_owner FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_audit_property FOREIGN KEY (property_id)
        REFERENCES properties(property_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_audit_employee FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id) ON DELETE SET NULL ON UPDATE CASCADE,
    KEY idx_audit_trail_p_owner_id (p_owner_id),
    KEY idx_audit_trail_property_id (property_id),
    KEY idx_audit_trail_employee_id (employee_id),
    KEY idx_audit_trail_module (module),
    KEY idx_audit_trail_action (action),
    KEY idx_audit_trail_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


/* =============================================================================
   SECTION 10: FOUNDATIONAL MASTER CATALOG, LOOKUPS & SYSTEM ROLES SEED DATA
   ============================================================================= */

/* =============================================================================
   KONKANTRIP HOSPITALITY PLATFORM - MASTER CATALOG & LOOKUPS SEED SCRIPT
   =============================================================================
   This script populates all foundational master tables, system lookups, 
   predefined RBAC roles, granular permissions, and super-admin accounts.
   
   Database: konkantrip
   Context: Konkan Tourism & Hospitality (Hotels, Resorts, Beach Villas, Homestays)
   Execution: Safe & Idempotent (INSERT IGNORE)
   ============================================================================= */

/* =============================================================================
   SECTION 1: LANGUAGES (Regional & International Tourist Languages)
   ============================================================================= */
INSERT IGNORE INTO languages (
    language_id, language_uuid, language_name, native_name, iso_639_1, iso_639_2, language_code, text_direction, flag_icon, display_order, is_indian_language, is_active
) VALUES
(1, UUID(), 'English', 'English', 'en', 'eng', 'en-US', 'LTR', 'flags/en.svg', 1, 0, 1),
(2, UUID(), 'Marathi', 'मराठी', 'mr', 'mar', 'mr-IN', 'LTR', 'flags/mr.svg', 2, 1, 1),
(3, UUID(), 'Hindi', 'हिन्दी', 'hi', 'hin', 'hi-IN', 'LTR', 'flags/hi.svg', 3, 1, 1),
(4, UUID(), 'Gujarati', 'ગુજરાતી', 'gu', 'guj', 'gu-IN', 'LTR', 'flags/gu.svg', 4, 1, 1),
(5, UUID(), 'Kannada', 'ಕನ್ನಡ', 'kn', 'kan', 'kn-IN', 'LTR', 'flags/kn.svg', 5, 1, 1),
(6, UUID(), 'German', 'Deutsch', 'de', 'deu', 'de-DE', 'LTR', 'flags/de.svg', 6, 0, 1),
(7, UUID(), 'French', 'Français', 'fr', 'fra', 'fr-FR', 'LTR', 'flags/fr.svg', 7, 0, 1);


/* =============================================================================
   SECTION 3: DOCUMENT TYPES (Legal & Hospitality Compliance)
   ============================================================================= */
INSERT IGNORE INTO document_types (
    document_type_id, document_type_uuid, document_name, document_slug, document_category, description, accepted_file_types, max_file_size_mb, is_mandatory, requires_expiry, requires_verification, validity_period_days, display_order, is_active
) VALUES
(1, UUID(), 'Property Ownership Proof / 7/12 Extract', 'property-7-12-extract', 'Property', 'Official land ownership record from Maharashtra Revenue Department', '["pdf", "jpg", "png"]', 10, 1, 0, 1, NULL, 1, 1),
(2, UUID(), 'MTDC Tourism Registration Certificate', 'mtdc-tourism-registration', 'Government', 'Maharashtra Tourism Development Corporation official registration certificate', '["pdf"]', 10, 1, 1, 1, 365, 2, 1),
(3, UUID(), 'Fire Safety NOC', 'fire-safety-noc', 'Safety', 'No Objection Certificate issued by Local Fire Department', '["pdf"]', 5, 1, 1, 1, 365, 3, 1),
(4, UUID(), 'FSSAI Food Business License', 'fssai-license', 'License', 'Food Safety and Standards Authority of India commercial food license', '["pdf", "jpg"]', 5, 0, 1, 1, 730, 4, 1),
(5, UUID(), 'GST Registration Certificate', 'gst-certificate', 'Tax', 'Goods and Services Tax certificate for hospitality accommodations', '["pdf"]', 5, 1, 0, 1, NULL, 5, 1),
(6, UUID(), 'Local Gram Panchayat / Municipal NOC', 'gram-panchayat-noc', 'Government', 'NOC from local village authority or municipal council', '["pdf", "jpg"]', 5, 1, 0, 1, NULL, 6, 1),
(7, UUID(), 'Electricity Bill / Utility Proof', 'electricity-bill', 'Property', 'Recent commercial or domestic electricity bill for address verification', '["pdf", "jpg", "png"]', 5, 0, 0, 1, 90, 7, 1),
(8, UUID(), 'Police Verification Clearance', 'police-verification', 'Safety', 'Local police station verification certificate for guest accommodation', '["pdf"]', 5, 0, 1, 1, 365, 8, 1);


/* =============================================================================
   SECTION 4: NEARBY PLACE TYPES
   ============================================================================= */
INSERT IGNORE INTO nearby_place_types (
    nearby_place_type_id, nearby_place_type_uuid, place_type_name, place_type_slug, place_icon, marker_color, description, display_order, is_transport, is_tourist_place, is_essential_service, is_active
) VALUES
(1, UUID(), 'Beach', 'beach', 'icons/beach.svg', '#00A8FF', 'Sandy coastal beaches, water sports, and sunset points', 1, 0, 1, 0, 1),
(2, UUID(), 'Sea Fort / Heritage Monument', 'sea-fort-heritage', 'icons/fort.svg', '#E67E22', 'Historic sea forts, hill forts and cultural monuments (e.g. Sindhudurg, Murud)', 2, 0, 1, 0, 1),
(3, UUID(), 'Railway Station', 'railway-station', 'icons/train.svg', '#2ECC71', 'Konkan Railway and local rail transit stations', 3, 1, 0, 0, 1),
(4, UUID(), 'Temple / Pilgrim Site', 'temple-pilgrim-site', 'icons/temple.svg', '#F39C12', 'Ancient and prominent temples of coastal Maharashtra', 4, 0, 1, 0, 1),
(5, UUID(), 'Hospital / Emergency Clinic', 'hospital-clinic', 'icons/hospital.svg', '#E74C3C', '24/7 Emergency medical hospitals and primary health centers', 5, 0, 0, 1, 1),
(6, UUID(), 'Scuba Diving & Water Sports Center', 'water-sports-center', 'icons/scuba.svg', '#0984E3', 'Scuba diving, parasailing, jet ski, and snorkeling centers', 6, 0, 1, 0, 1),
(7, UUID(), 'Local Market / Fish Market', 'local-market', 'icons/market.svg', '#6C5CE7', 'Fresh seafood markets, Konkani spice and mango markets', 7, 0, 0, 1, 1),
(8, UUID(), 'Airport', 'airport', 'icons/plane.svg', '#00CEC9', 'Nearest domestic or international airports (e.g. Chipi Sindhudurg, Goa Mopa)', 8, 1, 0, 0, 1),
(9, UUID(), 'Waterfall / Nature Spot', 'waterfall-nature', 'icons/waterfall.svg', '#00B894', 'Seasonal waterfalls, mango orchards, and Western Ghats viewpoints', 9, 0, 1, 0, 1);


/* =============================================================================
   SECTION 5: PROPERTY HOUSE RULE CATEGORIES
   ============================================================================= */
INSERT IGNORE INTO property_house_rule_categories (
    rule_category_id, rule_category_uuid, category_name, category_icon, description, display_order, is_active
) VALUES
(1, UUID(), 'Check-in & Check-out', 'icons/clock.svg', 'Rules governing guest check-in, key handover, and checkout schedule', 1, 1),
(2, UUID(), 'Noise & Quiet Hours', 'icons/volume-mute.svg', 'Policies restricting loud music and late night disturbance', 2, 1),
(3, UUID(), 'Pets & Animals', 'icons/paw.svg', 'Guidelines on pet accommodation, leashing, and hygiene', 3, 1),
(4, UUID(), 'Smoking & Alcohol', 'icons/smoke-free.svg', 'Designated smoking areas and alcohol consumption policies', 4, 1),
(5, UUID(), 'Visitors & Celebrations', 'icons/users.svg', 'Guest visitor policies, bachelor parties, and private event guidelines', 5, 1),
(6, UUID(), 'Swimming Pool Usage', 'icons/pool-rules.svg', 'Pool timings, swimwear guidelines, and child safety rules', 6, 1),
(7, UUID(), 'Kitchen & Self-Cooking', 'icons/kitchen.svg', 'Self-cooking guidelines, kitchen usage fees, and cleanup rules', 7, 1);


/* =============================================================================
   SECTION 6: TAGS & SEARCH BADGES
   ============================================================================= */
INSERT IGNORE INTO tags (
    tag_id, tag_uuid, tag_name, tag_slug, tag_color, display_order, status
) VALUES
(1, UUID(), 'Beachfront', 'beachfront', '#0288D1', 1, 1),
(2, UUID(), 'Homestyle Konkani Food', 'homestyle-konkani-food', '#FB8C00', 2, 1),
(3, UUID(), 'Sea View', 'sea-view', '#00ACC1', 3, 1),
(4, UUID(), 'Pet Friendly', 'pet-friendly', '#43A047', 4, 1),
(5, UUID(), 'Family Friendly', 'family-friendly', '#8E24AA', 5, 1),
(6, UUID(), 'Couple Friendly', 'couple-friendly', '#E91E63', 6, 1),
(7, UUID(), 'Private Swimming Pool', 'private-swimming-pool', '#00BCD4', 7, 1),
(8, UUID(), 'Workation / Fast Wi-Fi', 'workation-fast-wifi', '#3F51B5', 8, 1),
(9, UUID(), 'Pure Vegetarian Kitchen', 'pure-vegetarian-kitchen', '#4CAF50', 9, 1),
(10, UUID(), 'Budget Homestay', 'budget-homestay', '#795548', 10, 1),
(11, UUID(), 'Luxury Villa', 'luxury-villa', '#D4AF37', 11, 1);


/* =============================================================================
   SECTION 7: AMENITY CATEGORIES & AMENITIES
   ============================================================================= */
INSERT IGNORE INTO amenity_categories (
    amenity_category_id, amenity_category_uuid, category_name, category_icon, display_order, status
) VALUES
(1, UUID(), 'General & Connectivity', 'icons/wifi.svg', 1, 1),
(2, UUID(), 'Outdoor & Leisure', 'icons/pool.svg', 2, 1),
(3, UUID(), 'Food & Dining', 'icons/dining.svg', 3, 1),
(4, UUID(), 'Safety & Security', 'icons/shield.svg', 4, 1),
(5, UUID(), 'Parking & Transportation', 'icons/car.svg', 5, 1),
(6, UUID(), 'Comfort & Convenience', 'icons/sparkles.svg', 6, 1);

INSERT IGNORE INTO amenities (
    amenity_id, amenity_uuid, amenity_category_id, amenity_name, amenity_icon, amenity_description, display_order, is_popular, status
) VALUES
(1, UUID(), 1, 'High-Speed Wi-Fi', 'amenities/wifi.svg', 'Complimentary fiber optic wireless internet across all rooms and public spaces', 1, 1, 1),
(2, UUID(), 1, '100% Power Backup / Generator', 'amenities/power.svg', 'Continuous 24x7 inverter and DG set power backup for uninterrupted electricity', 2, 1, 1),
(3, UUID(), 2, 'Swimming Pool', 'amenities/pool.svg', 'Clean swimming pool with dedicated shallow kids section', 3, 1, 1),
(4, UUID(), 2, 'Lush Coconut Grove & Lawn', 'amenities/lawn.svg', 'Spacious private garden, coconut orchard, and hammock relaxation area', 4, 1, 1),
(5, UUID(), 2, 'Bonfire & Campfire Setup', 'amenities/bonfire.svg', 'Nightly campfire setup in outdoor private lawn (chargeable on request)', 5, 0, 1),
(6, UUID(), 2, 'Barbecue (BBQ) Grill', 'amenities/bbq.svg', 'Outdoor charcoal barbecue grill and grilling skewers available', 6, 0, 1),
(7, UUID(), 3, 'Authentic Konkani Dining Kitchen', 'amenities/kitchen.svg', 'Freshly cooked authentic Malvani seafood, Surmai/Pomfret fry, and veg thalis', 7, 1, 1),
(8, UUID(), 3, 'Complimentary Breakfast', 'amenities/breakfast.svg', 'Traditional breakfast including Poha, Ghavane, Amboli, and Masala Chai', 8, 1, 1),
(9, UUID(), 4, '24x7 CCTV Surveillance', 'amenities/cctv.svg', 'Round-the-clock closed circuit surveillance across perimeter and public areas', 9, 1, 1),
(10, UUID(), 4, 'Doctor on Call & First Aid', 'amenities/medical.svg', 'Emergency first aid box and tie-up with local on-call physician', 10, 0, 1),
(11, UUID(), 5, 'Free Private Parking', 'amenities/parking.svg', 'Dedicated secure parking space on property for cars and tourist vans', 11, 1, 1),
(12, UUID(), 5, 'EV Charging Station', 'amenities/ev.svg', 'Electric vehicle charging point available on premises', 12, 0, 1),
(13, UUID(), 6, 'Solar Hot Water System', 'amenities/solar.svg', 'Eco-friendly 24x7 solar water heating for all bathrooms', 13, 1, 1),
(14, UUID(), 6, 'Caretaker on Site', 'amenities/caretaker.svg', 'Resident caretaker available round the clock for guest assistance and luggage', 14, 1, 1),
(15, UUID(), 6, 'Direct Beach Access', 'amenities/beach-access.svg', 'Private pathway with direct access to sandy beach within 2 minutes walk', 15, 1, 1);


/* =============================================================================
   SECTION 8: PROPERTY IMAGE TYPES
   ============================================================================= */
INSERT IGNORE INTO property_image_types (
    image_type_id, image_type_uuid, image_type_name, description, display_order, status
) VALUES
(1, UUID(), 'Property Exterior & Facade', 'Architectural facade, landscape, and main property entrance', 1, 1),
(2, UUID(), 'Lobby & Reception', 'Front desk, reception counter, and welcome lounge', 2, 1),
(3, UUID(), 'Swimming Pool & Lawns', 'Pool deck, coconut orchard lawns, and outdoor seating areas', 3, 1),
(4, UUID(), 'Restaurant & Dining Area', 'In-house dining hall, open-air beach dining shack, and restaurant', 4, 1),
(5, UUID(), 'Scenic Coastal Views', 'Panoramic sea views, sunset horizon, and coastal landscapes', 5, 1),
(6, UUID(), 'Aerial / Drone View', 'Top-down drone aerial view of the property and beachfront landscape', 6, 1);


/* =============================================================================
   SECTION 9: CONTACT TYPES
   ============================================================================= */
INSERT IGNORE INTO contact_types (
    contact_type_id, contact_type_uuid, contact_type_name, description, display_order, status
) VALUES
(1, UUID(), 'Front Desk & Reception', 'On-duty reception desk for guest check-in, key handover, and concierge', 1, 1),
(2, UUID(), 'Property Owner / General Manager', 'Direct contact of the property owner or general manager', 2, 1),
(3, UUID(), 'Reservations & Booking Office', 'Dedicated office line for advance booking inquiries and group bookings', 3, 1),
(4, UUID(), 'Emergency 24x7 Support', 'Local emergency contact available round-the-clock', 4, 1),
(5, UUID(), 'Dining & Kitchen Incharge', 'Head chef or kitchen manager for meal customization and banquet catering', 5, 1);


/* =============================================================================
   SECTION 10: CERTIFICATION TYPES
   ============================================================================= */
INSERT IGNORE INTO certification_types (
    certification_type_id, certification_type_uuid, certification_name, certification_slug, certification_category, issuing_authority, description, validity_required, default_validity_years, mandatory_for_property, renewable, verification_required, display_order, certification_icon, website_url, is_active
) VALUES
(1, UUID(), 'MTDC Tourism Recognition', 'mtdc-tourism-recognition', 'Tourism', 'Maharashtra Tourism Development Corporation', 'Official tourism classification certificate for registered coastal stays', 1, 3, 1, 1, 1, 1, 'badges/mtdc.svg', 'https://www.mtdc.co', 1),
(2, UUID(), 'FSSAI Hygiene Rating', 'fssai-hygiene-rating', 'Food', 'Food Safety and Standards Authority of India', 'National hygiene and food safety star certification for dining kitchens', 1, 2, 0, 1, 1, 2, 'badges/fssai.svg', 'https://fssai.gov.in', 1),
(3, UUID(), 'ISO 9001:2015 Quality Standard', 'iso-9001-2015-quality', 'Quality', 'International Organization for Standardization', 'Certified international standard for excellence in hospitality service', 1, 3, 0, 1, 1, 3, 'badges/iso.svg', 'https://iso.org', 1),
(4, UUID(), 'Konkan Eco-Tourism Green Badge', 'konkan-eco-green-badge', 'Environmental', 'Konkan Eco-Tourism Board', 'Recognition for rainwater harvesting, solar heating, and sustainable coastal practices', 1, 1, 0, 1, 1, 4, 'badges/eco.svg', 'https://ecotourism.gov.in', 1),
(5, UUID(), 'Fire Safety & Disaster Readiness NOC', 'fire-safety-noc-cert', 'Safety', 'Maharashtra Fire Services', 'State certified fire prevention and safety compliance certification', 1, 1, 1, 1, 1, 5, 'badges/fire.svg', 'https://mahafireservice.gov.in', 1);


/* =============================================================================
   SECTION 11: BED TYPES
   ============================================================================= */
INSERT IGNORE INTO bed_types (
    bed_type_id, bed_type_uuid, bed_type_name, bed_type_slug, short_name, description, bed_size, width_cm, length_cm, maximum_occupancy, suitable_for, icon, display_order, is_standard, is_active
) VALUES
(1, UUID(), 'King Size Bed', 'king-size-bed', 'King', 'Luxurious double mattress for couples', '76 x 80 inches', 193, 203, 2, '2 Adults / Couples', 'beds/king.svg', 1, 1, 1),
(2, UUID(), 'Queen Size Bed', 'queen-size-bed', 'Queen', 'Comfortable double bed ideal for 2 adults', '60 x 80 inches', 152, 203, 2, '2 Adults', 'beds/queen.svg', 2, 1, 1),
(3, UUID(), 'Twin Single Beds', 'twin-single-beds', 'Twin', 'Pair of separate single cots for solo travellers or friends', '38 x 75 inches each', 97, 191, 2, '2 Adults', 'beds/twin.svg', 3, 1, 1),
(4, UUID(), 'Single Cot', 'single-cot', 'Single', 'Standard single bed for solo guest', '38 x 75 inches', 97, 191, 1, '1 Adult', 'beds/single.svg', 4, 1, 1),
(5, UUID(), 'Convertible Sofa Bed', 'convertible-sofa-bed', 'Sofa Bed', 'Convertible living room sofa cum bed for extra guests', '54 x 75 inches', 137, 191, 2, 'Extra guests or children', 'beds/sofa.svg', 5, 0, 1),
(6, UUID(), 'Bunk Bed', 'bunk-bed', 'Bunk', 'Two-tier bunk bed ideal for kids or group hostel rooms', '38 x 75 inches each', 97, 191, 2, '2 Kids / Adults', 'beds/bunk.svg', 6, 0, 1),
(7, UUID(), 'Extra Floor Mattress', 'extra-floor-mattress', 'Rollaway', 'Comfortable rollaway folding floor mattress with linen', '36 x 72 inches', 91, 182, 1, '1 Adult / Child', 'beds/rollaway.svg', 7, 0, 1);


/* =============================================================================
   SECTION 12: ROOM TYPES (Master Room Templates)
   ============================================================================= */
INSERT IGNORE INTO room_types (
    room_type_id, room_type_uuid, room_type_name, room_type_slug, short_name, room_category, description, default_guest_capacity, maximum_guest_capacity, default_room_area, room_area_unit, default_bathrooms, default_balcony, default_kitchen, default_living_room, default_air_conditioning, default_wifi, default_breakfast, display_order, is_active
) VALUES
(1, UUID(), 'Deluxe Sea Facing Room', 'deluxe-sea-facing-room', 'Deluxe Sea View', 'Resort', 'Air-conditioned luxury room featuring private balcony with unobstructed sea views', 2, 3, 350.00, 'Sq.ft', 1, 1, 0, 0, 1, 1, 1, 1, 1),
(2, UUID(), 'Coastal Wooden Cottage', 'coastal-wooden-cottage', 'Wooden Cottage', 'Cottage', 'Eco-friendly wooden cottage surrounded by coconut trees near the beach', 2, 4, 420.00, 'Sq.ft', 1, 1, 0, 1, 1, 1, 1, 2, 1),
(3, UUID(), 'Executive Family Suite', 'executive-family-suite', 'Family Suite', 'Resort', 'Spacious 2-bedroom suite with interconnecting living lounge for families', 4, 6, 700.00, 'Sq.ft', 2, 1, 0, 1, 1, 1, 1, 3, 1),
(4, UUID(), 'Heritage Konkani Homestay Room', 'heritage-konkani-homestay-room', 'Homestay Room', 'Homestay', 'Traditional room built with Konkan red laterite stone and central courtyard access', 2, 3, 280.00, 'Sq.ft', 1, 0, 0, 0, 1, 1, 0, 4, 1),
(5, UUID(), 'Beachfront Private Luxury Villa', 'beachfront-private-luxury-villa', 'Beach Villa', 'Villa', 'Exclusive 3-bedroom private beach villa with personal lawn, kitchen, and deck', 6, 8, 1500.00, 'Sq.ft', 3, 1, 1, 1, 1, 1, 1, 5, 1),
(6, UUID(), 'Standard AC Room', 'standard-ac-room', 'Standard AC', 'Hotel', 'Comfortable air-conditioned bedroom with attached modern bathroom', 2, 3, 250.00, 'Sq.ft', 1, 0, 0, 0, 1, 1, 0, 6, 1),
(7, UUID(), 'Standard Non-AC Room', 'standard-non-ac-room', 'Standard Non-AC', 'Homestay', 'Budget friendly naturally ventilated room with ceiling fan and attached bath', 2, 3, 220.00, 'Sq.ft', 1, 0, 0, 0, 0, 1, 0, 7, 1);


/* =============================================================================
   SECTION 13: ROOM STATUS (Lifecycle & Housekeeping States)
   ============================================================================= */
INSERT IGNORE INTO room_status (
    room_status_id, room_status_uuid, status_name, status_slug, description, status_color, status_icon, is_bookable, affects_inventory, display_order, is_system_status, is_active
) VALUES
(1, UUID(), 'Available & Clean', 'available-clean', 'Room is thoroughly cleaned, inspected, and ready for immediate check-in', '#2ECC71', 'icons/check-circle.svg', 1, 1, 1, 1, 1),
(2, UUID(), 'Occupied', 'occupied', 'Guest is currently checked-in and occupying the room', '#3498DB', 'icons/user-check.svg', 0, 1, 2, 1, 1),
(3, UUID(), 'Housekeeping Required', 'housekeeping-required', 'Guest checked out; room awaiting housekeeping and linen change', '#F39C12', 'icons/broom.svg', 0, 1, 3, 1, 1),
(4, UUID(), 'Cleaning in Progress', 'cleaning-in-progress', 'Housekeeping staff is currently cleaning and sanitizing the room', '#E67E22', 'icons/refresh.svg', 0, 1, 4, 1, 1),
(5, UUID(), 'Under Maintenance', 'under-maintenance', 'Room blocked for scheduled AC, plumbing, or electrical repairs', '#E74C3C', 'icons/wrench.svg', 0, 1, 5, 1, 1),
(6, UUID(), 'Blocked by Management', 'blocked-by-management', 'Room reserved for owner stay or VIP corporate booking hold', '#9B59B6', 'icons/lock.svg', 0, 1, 6, 1, 1),
(7, UUID(), 'Out of Order', 'out-of-order', 'Room is temporarily unavailable for long term renovation or damage', '#7F8C8D', 'icons/alert-circle.svg', 0, 1, 7, 1, 1);


/* =============================================================================
   SECTION 14: ROOM VIEWS
   ============================================================================= */
INSERT IGNORE INTO room_views (
    room_view_id, room_view_uuid, room_view_name, room_view_slug, short_name, description, icon, display_order, premium_view, additional_charge, is_active
) VALUES
(1, UUID(), 'Direct Arabian Sea View', 'direct-arabian-sea-view', 'Sea View', 'Unobstructed 180-degree panoramic view of the sea and sunset', 'views/sea.svg', 1, 1, 500.00, 1),
(2, UUID(), 'Partial Sea View', 'partial-sea-view', 'Partial Sea', 'Side balcony view offering partial glimpse of the ocean', 'views/partial-sea.svg', 2, 1, 250.00, 1),
(3, UUID(), 'Coconut Grove & Garden View', 'coconut-grove-garden-view', 'Garden View', 'Lush green views of coconut palms, betel nut trees, and flowering gardens', 'views/garden.svg', 3, 0, 0.00, 1),
(4, UUID(), 'Swimming Pool View', 'swimming-pool-view', 'Pool View', 'Balcony facing the illuminated pool deck and outdoor patio', 'views/pool.svg', 4, 0, 200.00, 1),
(5, UUID(), 'Western Ghats Hill View', 'western-ghats-hill-view', 'Hill View', 'Misty hills and forest valleys of the Western Ghats range', 'views/hills.svg', 5, 0, 0.00, 1),
(6, UUID(), 'Traditional Courtyard View', 'traditional-courtyard-view', 'Courtyard View', 'Inner courtyard view with traditional Konkani wooden pillared veranda', 'views/courtyard.svg', 6, 0, 0.00, 1);


/* =============================================================================
   SECTION 15: ROOM IMAGE TYPES
   ============================================================================= */
INSERT IGNORE INTO room_image_types (
    room_image_type_id, room_image_type_uuid, image_type_name, image_type_slug, description, image_category, recommended_width, recommended_height, allowed_formats, max_file_size_mb, is_cover_allowed, is_required, display_order, is_active
) VALUES
(1, UUID(), 'Master Bedroom Interior', 'master-bedroom-interior', 'Wide angle shot of the bedroom interior and bed setup', 'Bedroom', 1920, 1080, '["jpg", "png", "webp"]', 10, 1, 1, 1, 1),
(2, UUID(), 'Attached Bathroom', 'attached-bathroom', 'Clean view of the bathroom amenities, shower, and vanity', 'Bathroom', 1920, 1080, '["jpg", "png", "webp"]', 10, 0, 1, 2, 1),
(3, UUID(), 'Balcony & Ocean View', 'balcony-ocean-view', 'Photo taken from the private room balcony showing the sea panorama', 'View', 1920, 1080, '["jpg", "png", "webp"]', 10, 1, 0, 3, 1),
(4, UUID(), 'Living & Seating Lounge', 'living-seating-lounge', 'Room seating setup, coffee table, and work desk', 'Interior', 1920, 1080, '["jpg", "png", "webp"]', 10, 0, 0, 4, 1),
(5, UUID(), 'Cottage Veranda & Exterior', 'cottage-veranda-exterior', 'Outdoor private sit-out porch and cottage entrance view', 'Exterior', 1920, 1080, '["jpg", "png", "webp"]', 10, 1, 0, 5, 1);


/* =============================================================================
   SECTION 16: ROOM FACILITY CATEGORIES & FACILITIES
   ============================================================================= */
INSERT IGNORE INTO room_facility_categories (
    room_facility_category_id, room_facility_category_uuid, category_name, category_slug, category_description, category_icon, display_order, is_active
) VALUES
(1, UUID(), 'Bathroom & Toiletries', 'bathroom-toiletries', 'Private bathroom amenities, hot water, and personal care supplies', 'icons/bath.svg', 1, 1),
(2, UUID(), 'Media & Technology', 'media-technology', 'Entertainment, high speed internet, and multimedia devices', 'icons/tv.svg', 2, 1),
(3, UUID(), 'Refreshments & Kitchenette', 'refreshments-kitchenette', 'Coffee/tea makers, mini-fridge, and drinking water facilities', 'icons/coffee.svg', 3, 1),
(4, UUID(), 'Climate & Comfort', 'climate-comfort', 'Air conditioning, fans, heating, and bedding comforts', 'icons/fan.svg', 4, 1),
(5, UUID(), 'Workspace & Convenience', 'workspace-convenience', 'Work desk, safe deposit, wardrobes, and power outlets', 'icons/briefcase.svg', 5, 1);

INSERT IGNORE INTO room_facilities (
    room_facility_id, room_facility_uuid, room_facility_category_id, facility_name, facility_slug, facility_icon, description, display_order, is_active
) VALUES
(1, UUID(), 1, 'Geyser / 24x7 Hot Water', 'geyser-hot-water', 'facilities/geyser.svg', 'Instant water heater / geyser with hot and cold shower mixer', 1, 1),
(2, UUID(), 1, 'Complimentary Premium Toiletries', 'premium-toiletries', 'facilities/soap.svg', 'Herbal soap, shampoo, dental kit, and fresh cotton bath towels', 2, 1),
(3, UUID(), 1, 'Hair Dryer', 'hair-dryer', 'facilities/dryer.svg', 'Electric hair dryer provided in the bathroom', 3, 1),
(4, UUID(), 2, '43-inch 4K Smart TV with OTT', 'smart-tv-ott', 'facilities/tv.svg', 'Smart LED television with Netflix, Prime Video, and cable channels', 4, 1),
(5, UUID(), 2, 'In-Room High-Speed Wi-Fi', 'in-room-wifi', 'facilities/wifi.svg', 'Dedicated optical fiber Wi-Fi access point in the room', 5, 1),
(6, UUID(), 3, 'Electric Kettle with Tea & Coffee Kit', 'electric-kettle-tea-coffee', 'facilities/kettle.svg', 'Electric kettle, coffee sachets, tea bags, dairy creamer, and sugar', 6, 1),
(7, UUID(), 3, 'Mini Refrigerator', 'mini-refrigerator', 'facilities/fridge.svg', 'Compact silent mini fridge for beverages and fruits', 7, 1),
(8, UUID(), 3, 'Complimentary Packaged Drinking Water', 'packaged-water', 'facilities/water.svg', 'Two 1-litre sealed mineral water bottles replenished daily', 8, 1),
(9, UUID(), 4, 'Split Air Conditioner (Inverter AC)', 'split-air-conditioner', 'facilities/ac.svg', 'Energy efficient silent split air conditioner with remote temperature control', 9, 1),
(10, UUID(), 4, 'High-Speed Ceiling Fan', 'ceiling-fan', 'facilities/fan.svg', 'Silent high-speed decorative ceiling fan', 10, 1),
(11, UUID(), 5, 'Electronic Digital Safe', 'electronic-digital-safe', 'facilities/safe.svg', 'Motorized digital keypad safety locker for laptop and valuables', 11, 1),
(12, UUID(), 5, 'Full Size Wardrobe with Hangers', 'wardrobe-hangers', 'facilities/wardrobe.svg', 'Wooden wardrobe with full length mirror and wooden coat hangers', 12, 1),
(13, UUID(), 5, 'Dedicated Work Desk & Ergonomic Chair', 'work-desk-chair', 'facilities/desk.svg', 'Dedicated laptop work table with universal power sockets and chair', 13, 1);


/* =============================================================================
   SECTION 17: MEAL PLANS
   ============================================================================= */
INSERT IGNORE INTO meal_plans (
    meal_plan_id, meal_plan_uuid, meal_plan_name, meal_plan_slug, short_name, description, breakfast_included, lunch_included, dinner_included, snacks_included, beverages_included, alcoholic_beverages_included, breakfast_type, meal_serving_type, is_all_inclusive, is_complimentary, display_order, is_active
) VALUES
(1, UUID(), 'European Plan (Room Only)', 'european-plan-ep', 'EP', 'Room stay only without any included meals', 0, 0, 0, 0, 0, 0, 'None', 'None', 0, 0, 1, 1),
(2, UUID(), 'Continental Plan (Bed & Breakfast)', 'continental-plan-cp', 'CP', 'Room stay inclusive of freshly prepared daily morning breakfast and tea', 1, 0, 0, 0, 1, 0, 'Buffet', 'Buffet', 0, 1, 2, 1),
(3, UUID(), 'Modified American Plan (Half Board)', 'modified-american-plan-map', 'MAP', 'Room stay inclusive of breakfast and your choice of authentic lunch or dinner', 1, 0, 1, 0, 1, 0, 'Buffet', 'Buffet', 0, 0, 3, 1),
(4, UUID(), 'American Plan (Full Board - All Meals)', 'american-plan-ap', 'AP', 'All-inclusive stay including breakfast, traditional Konkani lunch, high tea, and dinner', 1, 1, 1, 1, 1, 0, 'Buffet', 'Buffet', 1, 0, 4, 1);


/* =============================================================================
   SECTION 18: PERMISSIONS REGISTRY (30+ Granular System Permissions)
   ============================================================================= */
INSERT IGNORE INTO permissions (
    permission_id, module, action, permission_code, description, is_active, created_at, updated_at
) VALUES
-- Properties Module
(1, 'properties', 'read', 'properties:read', 'View properties and property details', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'properties', 'create', 'properties:create', 'Create new properties', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'properties', 'update', 'properties:update', 'Update property details, amenities, and locations', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'properties', 'delete', 'properties:delete', 'Delete or deactivate properties', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'properties', 'manage', 'properties:manage', 'Manage property sub-resources (images, policies, documents)', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Rooms Module
(6, 'rooms', 'read', 'rooms:read', 'View rooms, beds, amenities, and room status', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'rooms', 'create', 'rooms:create', 'Create new rooms and inventory allocations', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'rooms', 'update', 'rooms:update', 'Update room configurations, pricing, and live room status', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'rooms', 'delete', 'rooms:delete', 'Delete or deactivate rooms', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 'rooms', 'manage', 'rooms:manage', 'Manage room sub-resources (beds, facilities, images)', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Inventory & Calendar Module
(11, 'inventory', 'read', 'inventory:read', 'View inventory calendar, rates, stock, and transactions', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 'inventory', 'update', 'inventory:update', 'Update daily inventory stock and base room rates', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(13, 'inventory', 'manage_blocks', 'inventory:manage_blocks', 'Create and release maintenance or VIP room blocks', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, 'inventory', 'manage_stopsell', 'inventory:manage_stopsell', 'Create and release stop-sell availability restrictions', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Bookings & Front Desk Module
(15, 'bookings', 'read', 'bookings:read', 'View guest reservations, arrival lists, and guest details', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(16, 'bookings', 'create', 'bookings:create', 'Create new guest reservations and walk-in bookings', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(17, 'bookings', 'update', 'bookings:update', 'Modify reservations, process guest check-in and check-out', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(18, 'bookings', 'delete', 'bookings:delete', 'Cancel guest reservations and process refunds', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Housekeeping Module
(19, 'housekeeping', 'read', 'housekeeping:read', 'View room cleanliness status and housekeeping task list', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(20, 'housekeeping', 'update', 'housekeeping:update', 'Update room cleaning, linen change, and inspection status', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Maintenance Module
(21, 'maintenance', 'read', 'maintenance:read', 'View maintenance work orders and repair tickets', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(22, 'maintenance', 'manage', 'maintenance:manage', 'Create, update, and resolve property & room maintenance tasks', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- CRM & Employees Module
(23, 'employees', 'read', 'employees:read', 'View staff profiles, designations, and property assignments', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(24, 'employees', 'create', 'employees:create', 'Add new employees and staff accounts', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(25, 'employees', 'update', 'employees:update', 'Update employee profiles, salary, and assigned roles', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(26, 'employees', 'delete', 'employees:delete', 'Deactivate or soft-delete employee accounts', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Roles & RBAC Module
(27, 'roles', 'read', 'roles:read', 'View employee roles and mapped permissions', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(28, 'roles', 'create', 'roles:create', 'Create custom staff roles', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(29, 'roles', 'update', 'roles:update', 'Update custom roles and permission mappings', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(30, 'roles', 'delete', 'roles:delete', 'Delete custom staff roles', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Reports & Financials Module
(31, 'reports', 'read', 'reports:read', 'View revenue analytics, occupancy metrics, and operational reports', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(32, 'financials', 'read', 'financials:read', 'View guest billing, invoices, payment settlements, and tax reports', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


/* =============================================================================
   SECTION 19: PREDEFINED SYSTEM ROLES & RBAC MAPPINGS
   ============================================================================= */
INSERT IGNORE INTO employee_roles (
    role_id, p_owner_id, role_name, role_slug, role_description, is_system_role, is_active, delete_status, created_at, updated_at
) VALUES
(1, NULL, 'Property Manager', 'property-manager', 'Full operational and managerial access across all assigned property modules', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, NULL, 'Front Desk / Receptionist', 'front-desk', 'Handles guest check-ins, reservations, room availability, and guest requests', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, NULL, 'Housekeeping Supervisor', 'housekeeping-supervisor', 'Manages room cleaning schedules, linen change, and room inspection status', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, NULL, 'Maintenance Staff', 'maintenance-staff', 'Handles property maintenance, repair tickets, and maintenance room blocks', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, NULL, 'Accountant / Finance', 'accountant-finance', 'Views guest invoices, payment settlements, revenue reports, and inventory rates', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, NULL, 'Sales & Marketing', 'sales-marketing', 'Oversees room rates, stop-sells, inventory availability, and promotional inquiries', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Map Permissions to System Roles
-- Role 1: Property Manager (All Permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- Role 2: Front Desk / Receptionist
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read', 'rooms:update',
    'inventory:read',
    'bookings:read', 'bookings:create', 'bookings:update',
    'housekeeping:read'
);

-- Role 3: Housekeeping Supervisor
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read', 'rooms:update',
    'housekeeping:read', 'housekeeping:update'
);

-- Role 4: Maintenance Staff
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read',
    'inventory:read', 'inventory:manage_blocks',
    'maintenance:read', 'maintenance:manage'
);

-- Role 5: Accountant / Finance
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 5, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read',
    'inventory:read',
    'bookings:read',
    'reports:read',
    'financials:read'
);

-- Role 6: Sales & Marketing
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 6, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read',
    'inventory:read', 'inventory:update', 'inventory:manage_stopsell',
    'bookings:read',
    'reports:read'
);



SET FOREIGN_KEY_CHECKS = 1;
