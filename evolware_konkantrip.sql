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
   SECTION 8: CRM EMPLOYEES & ROLE-BASED ACCESS CONTROL (RBAC)
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
    KEY idx_roles_owner (p_owner_id),
    KEY idx_roles_slug (role_slug),
    KEY idx_roles_system (is_system_role),
    KEY idx_roles_active_delete (is_active, delete_status),
    CONSTRAINT fk_employee_roles_owner FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON DELETE CASCADE ON UPDATE CASCADE
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
    UNIQUE KEY uq_employees_uuid (uuid),
    KEY idx_employees_owner (p_owner_id),
    KEY idx_employees_role (role_id),
    KEY idx_employees_email (email),
    KEY idx_employees_phone (phone),
    KEY idx_employees_status (status),
    KEY idx_employees_delete_status (delete_status),
    CONSTRAINT fk_employees_owner FOREIGN KEY (p_owner_id)
        REFERENCES property_owners(p_owner_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_employees_role FOREIGN KEY (role_id)
        REFERENCES employee_roles(role_id) ON DELETE RESTRICT ON UPDATE CASCADE
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
    UNIQUE KEY uq_property_employee (property_id, employee_id),
    KEY idx_pe_property (property_id),
    KEY idx_pe_employee (employee_id),
    KEY idx_pe_status_delete (status, delete_status),
    CONSTRAINT fk_property_employees_prop FOREIGN KEY (property_id)
        REFERENCES properties(property_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_property_employees_emp FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id) ON DELETE CASCADE ON UPDATE CASCADE
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
    KEY idx_employee_logs_time (employee_id, created_at),
    KEY idx_employee_logs_email (email, created_at),
    CONSTRAINT fk_employee_login_emp FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
                KEY idx_employee_logs_time (employee_id, created_at),
                KEY idx_employee_logs_email (email, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
