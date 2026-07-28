use  ;
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO roles(role_name, description) VALUES
('ADMIN','System Administrator'),
('CUSTOMER','Customer'),
('VENDOR','Vendor'),
('EMPLOYEE','Employee');

CREATE TABLE users (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    uuid CHAR(36) NOT NULL UNIQUE,

    profile_id INT,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(20) UNIQUE,

    password VARCHAR(255) NOT NULL,

    role_id INT NOT NULL DEFAULT 2,

    profile_image VARCHAR(255),

    is_email_verified BOOLEAN DEFAULT FALSE,

    is_phone_verified BOOLEAN DEFAULT FALSE,

    account_status ENUM(
        'ACTIVE',
        'INACTIVE',
        'BLOCKED',
        'DELETED'
    ) DEFAULT 'ACTIVE',

    last_login DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
    FOREIGN KEY(role_id)
    REFERENCES roles(id)

);



CREATE TABLE refresh_tokens (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    token TEXT NOT NULL,

    expires_at DATETIME NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);


CREATE TABLE login_history (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT,

    ip_address VARCHAR(100),

    device VARCHAR(255),

    browser VARCHAR(255),

    os VARCHAR(255),

    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'SUCCESS',
        'FAILED'
    ) DEFAULT 'SUCCESS',

    CONSTRAINT fk_login_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);


CREATE TABLE password_resets (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    otp VARCHAR(10),

    expires_at DATETIME,

    is_used BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);



CREATE TABLE email_verifications (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    token VARCHAR(255) NOT NULL,

    expires_at DATETIME,

    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);


CREATE INDEX idx_user_email
ON users(email);

CREATE INDEX idx_user_phone
ON users(phone);

CREATE INDEX idx_user_uuid
ON users(uuid);

CREATE INDEX idx_refresh_user
ON refresh_tokens(user_id);

CREATE INDEX idx_login_user
ON login_history(user_id);


-- =============================================
-- Properties Table
-- =============================================

CREATE TABLE properties (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    uuid CHAR(36) NOT NULL UNIQUE,

    owner_id BIGINT NOT NULL,

    property_name VARCHAR(255) NOT NULL,

    property_type ENUM(
        'HOTEL',
        'RESORT',
        'VILLA',
        'HOMESTAY',
        'APARTMENT',
        'COTTAGE'
    ) NOT NULL,

    description TEXT,

    email VARCHAR(255),

    phone VARCHAR(20),

    website VARCHAR(255),

    check_in_time TIME,

    check_out_time TIME,

    total_rooms INT DEFAULT 0,

    total_floors INT DEFAULT 1,

    star_rating TINYINT DEFAULT 0,

    price_per_night DECIMAL(10,2),

    currency VARCHAR(10) DEFAULT 'INR',

    address_line1 VARCHAR(255),

    address_line2 VARCHAR(255),

    city VARCHAR(100),

    taluka VARCHAR(100),

    district VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100) DEFAULT 'India',

    pincode VARCHAR(10),

    latitude DECIMAL(10,8),

    longitude DECIMAL(11,8),

    amenities JSON,

    thumbnail_image VARCHAR(255),

    is_verified BOOLEAN DEFAULT FALSE,

    is_featured BOOLEAN DEFAULT FALSE,

    property_status ENUM(
        'PENDING',
        'ACTIVE',
        'INACTIVE',
        'REJECTED'
    ) DEFAULT 'PENDING',

    average_rating DECIMAL(3,2) DEFAULT 0,

    total_reviews INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_property_owner
        FOREIGN KEY(owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

CREATE TABLE profiles (

    id INT AUTO_INCREMENT PRIMARY KEY,

    profile_name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    access_level INT NOT NULL,

    is_system_profile BOOLEAN DEFAULT TRUE,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

);