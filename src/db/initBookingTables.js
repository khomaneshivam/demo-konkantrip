const db = require("../config/db");

/**
 * Initializes tables for Phase 1 OTA Booking, Customer OTP,
 * Notifications, and Enquiries.
 */
async function initBookingTables() {
    try {
        console.log("Initializing Phase 1 Booking & Notification tables...");

        // 1. Customers Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS customers (
                customer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                customer_uuid CHAR(36) NOT NULL DEFAULT (UUID()),
                full_name VARCHAR(150) NOT NULL,
                mobile_number VARCHAR(20) NOT NULL,
                email VARCHAR(150) NULL,
                is_mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
                is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                status ENUM('Active', 'Inactive', 'Blocked') NOT NULL DEFAULT 'Active',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY idx_customers_mobile (mobile_number),
                KEY idx_customers_email (email),
                KEY idx_customers_uuid (customer_uuid)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Customer OTP Verifications Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS customer_otp_verifications (
                otp_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                customer_id BIGINT UNSIGNED NULL,
                identifier VARCHAR(150) NOT NULL,
                otp_type ENUM('Mobile', 'Email') NOT NULL DEFAULT 'Mobile',
                otp_hash VARCHAR(255) NOT NULL,
                purpose VARCHAR(50) NOT NULL DEFAULT 'Booking Verification',
                expires_at DATETIME NOT NULL,
                attempt_count INT NOT NULL DEFAULT 0,
                max_attempts INT NOT NULL DEFAULT 5,
                is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                verified_at DATETIME NULL,
                ip_address VARCHAR(45) NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_otp_identifier (identifier, is_verified, expires_at),
                KEY idx_otp_customer (customer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Bookings Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_uuid CHAR(36) NOT NULL DEFAULT (UUID()),
                booking_number VARCHAR(50) NOT NULL UNIQUE,
                customer_id BIGINT UNSIGNED NOT NULL,
                property_id BIGINT UNSIGNED NOT NULL,
                check_in_date DATE NOT NULL,
                check_out_date DATE NOT NULL,
                total_nights INT NOT NULL DEFAULT 1,
                total_guests INT NOT NULL DEFAULT 1,
                adults INT NOT NULL DEFAULT 1,
                children INT NOT NULL DEFAULT 0,
                guest_name VARCHAR(150) NOT NULL,
                guest_mobile VARCHAR(20) NOT NULL,
                guest_email VARCHAR(150) NULL,
                total_room_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                extra_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                taxes DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                final_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                currency VARCHAR(10) NOT NULL DEFAULT 'INR',
                booking_status ENUM('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'CONFIRMED',
                payment_status ENUM('Pending', 'Paid_At_Property', 'Partially_Paid', 'Paid', 'Refunded') NOT NULL DEFAULT 'Paid_At_Property',
                special_requests TEXT NULL,
                idempotency_key VARCHAR(100) NULL UNIQUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY idx_bookings_customer (customer_id),
                KEY idx_bookings_property (property_id),
                KEY idx_bookings_dates (check_in_date, check_out_date),
                KEY idx_bookings_status (booking_status),
                KEY idx_bookings_uuid (booking_uuid)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Booking Rooms Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_rooms (
                booking_room_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_id BIGINT UNSIGNED NOT NULL,
                room_id BIGINT UNSIGNED NOT NULL,
                room_name VARCHAR(150) NOT NULL,
                room_type_id BIGINT UNSIGNED NULL,
                quantity INT NOT NULL DEFAULT 1,
                nightly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_bk_rooms_booking (booking_id),
                KEY idx_bk_rooms_room (room_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Booking Status History Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_status_history (
                history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_id BIGINT UNSIGNED NOT NULL,
                old_status VARCHAR(50) NULL,
                new_status VARCHAR(50) NOT NULL,
                reason TEXT NULL,
                changed_by_type ENUM('Customer', 'Property Owner', 'Employee', 'Admin', 'System') NOT NULL DEFAULT 'Customer',
                changed_by_id BIGINT UNSIGNED NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_bsh_booking (booking_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. Notification Templates Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notification_templates (
                template_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                template_code VARCHAR(50) NOT NULL UNIQUE,
                channel ENUM('WhatsApp', 'Email', 'SMS') NOT NULL DEFAULT 'WhatsApp',
                template_name VARCHAR(100) NOT NULL,
                subject VARCHAR(255) NULL,
                content TEXT NOT NULL,
                parameters_schema JSON NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_notif_temp_code (template_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 7. Notification Messages Queue Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notification_messages (
                notification_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_id BIGINT UNSIGNED NULL,
                recipient_type ENUM('Customer', 'Property Front Desk', 'Property Owner', 'Admin') NOT NULL,
                recipient_phone VARCHAR(20) NULL,
                recipient_email VARCHAR(150) NULL,
                channel ENUM('WhatsApp', 'Email', 'SMS') NOT NULL DEFAULT 'WhatsApp',
                template_code VARCHAR(50) NULL,
                subject VARCHAR(255) NULL,
                payload JSON NULL,
                provider VARCHAR(50) NOT NULL DEFAULT 'Mock',
                provider_message_id VARCHAR(100) NULL,
                delivery_status ENUM('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRYING', 'FAILED_PERMANENT') NOT NULL DEFAULT 'QUEUED',
                retry_count INT NOT NULL DEFAULT 0,
                last_error TEXT NULL,
                sent_at DATETIME NULL,
                delivered_at DATETIME NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY idx_notif_booking (booking_id),
                KEY idx_notif_status (delivery_status),
                KEY idx_notif_channel (channel)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 8. Customer Enquiries Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS customer_enquiries (
                enquiry_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                enquiry_uuid CHAR(36) NOT NULL DEFAULT (UUID()),
                property_id BIGINT UNSIGNED NOT NULL,
                room_id BIGINT UNSIGNED NULL,
                guest_name VARCHAR(150) NOT NULL,
                guest_mobile VARCHAR(20) NOT NULL,
                guest_email VARCHAR(150) NULL,
                check_in_date DATE NULL,
                check_out_date DATE NULL,
                guests_count INT NOT NULL DEFAULT 1,
                message TEXT NOT NULL,
                status ENUM('New', 'Responded', 'Converted', 'Closed') NOT NULL DEFAULT 'New',
                notes TEXT NULL,
                responded_by BIGINT UNSIGNED NULL,
                responded_at DATETIME NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY idx_enq_property (property_id),
                KEY idx_enq_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Seed default notification templates if not present
        await seedDefaultNotificationTemplates();

        console.log("Phase 1 Booking & Notification tables initialized successfully.");
    } catch (error) {
        console.error("Error initializing booking tables:", error);
    }
}

async function seedDefaultNotificationTemplates() {
    const templates = [
        {
            code: "BOOKING_CONFIRMATION_CUSTOMER",
            channel: "WhatsApp",
            name: "Customer Booking Confirmation",
            subject: "Your KonkanTrip Booking is Confirmed!",
            content: "Hello {{guest_name}}! 🎉 Your booking at {{property_name}} is CONFIRMED.\n\n📅 Stay: {{check_in_date}} to {{check_out_date}} ({{total_nights}} nights)\n🏨 Room: {{room_name}} ({{quantity}} unit(s))\n👥 Guests: {{total_guests}}\n💳 Total: ₹{{final_amount}}\n🔖 Booking ID: {{booking_number}}\n\n📍 Property Address: {{property_address}}\n📞 Front Desk Contact: {{contact_phone}} ({{contact_name}})\n\nHave a memorable stay in Konkan! 🌴"
        },
        {
            code: "BOOKING_CONFIRMATION_CUSTOMER_EMAIL",
            channel: "Email",
            name: "Customer Booking Confirmation Email",
            subject: "Booking Confirmed: {{booking_number}} - {{property_name}}",
            content: "Dear {{guest_name}},\n\nYour reservation at {{property_name}} has been confirmed successfully.\n\nBooking Reference: {{booking_number}}\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\nTotal Nights: {{total_nights}}\nRoom: {{room_name}}\nGuests: {{total_guests}}\nTotal Amount: ₹{{final_amount}}\n\nProperty Contact: {{contact_name}} - {{contact_phone}}\nAddress: {{property_address}}\n\nThank you for booking with KonkanTrip!"
        },
        {
            code: "NEW_BOOKING_ALERT_FRONTDESK",
            channel: "WhatsApp",
            name: "Front Desk New Booking Alert",
            subject: "New Booking Received!",
            content: "🔔 *NEW RESERVATION ALERT* for {{property_name}}!\n\n🔖 Booking #: {{booking_number}}\n👤 Guest: {{guest_name}}\n📱 Mobile: {{guest_mobile}}\n📅 Dates: {{check_in_date}} to {{check_out_date}} ({{total_nights}} nights)\n🏨 Room: {{room_name}} ({{quantity}} unit(s))\n👥 Guests: {{total_guests}}\n💰 Total: ₹{{final_amount}} (Pay at Property)\n\nPlease ensure the room is ready for guest arrival."
        },
        {
            code: "BOOKING_CANCELLATION_CUSTOMER",
            channel: "WhatsApp",
            name: "Customer Booking Cancellation",
            subject: "Booking Cancellation Notice",
            content: "Hello {{guest_name}}, your booking {{booking_number}} at {{property_name}} has been CANCELLED.\n\nStay Dates: {{check_in_date}} to {{check_out_date}}\nIf you have any questions, please contact KonkanTrip support."
        },
        {
            code: "BOOKING_CANCELLATION_FRONTDESK",
            channel: "WhatsApp",
            name: "Front Desk Cancellation Alert",
            subject: "Booking Cancelled",
            content: "⚠️ *BOOKING CANCELLED* for {{property_name}}.\n\n🔖 Booking #: {{booking_number}}\n👤 Guest: {{guest_name}}\n📅 Dates: {{check_in_date}} to {{check_out_date}}\n🏨 Room: {{room_name}}\n\nInventory has been automatically released for resale."
        },
        {
            code: "CUSTOMER_OTP_EMAIL",
            channel: "Email",
            name: "Customer Email OTP Verification",
            subject: "{{otp}} is your KonkanTrip verification code",
            content: "Hello,\n\nYour KonkanTrip verification code is:\n\n🔑 {{otp}}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.\n\nHappy travels,\nTeam KonkanTrip"
        }
    ];

    for (const t of templates) {
        await db.query(
            `INSERT IGNORE INTO notification_templates (template_code, channel, template_name, subject, content)
             VALUES (?, ?, ?, ?, ?)`,
            [t.code, t.channel, t.name, t.subject, t.content]
        );
    }
}

module.exports = { initBookingTables };
