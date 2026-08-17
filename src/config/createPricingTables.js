const db = require("./db");

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
    try {
        const [rows] = await db.query(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [tableName, columnName]
        );
        if (rows.length === 0) {
            await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            console.log(`Added column '${columnName}' to table '${tableName}'`);
        }
    } catch (err) {
        console.warn(`Warning checking/adding column '${columnName}' to '${tableName}':`, err.message);
    }
}

async function initializePricingTables() {
    try {
        console.log("Initializing Pricing, Discount, and Seasonal Rates schema...");

        // 1. Add pricing columns to rooms table
        await addColumnIfNotExists("rooms", "base_price", "DECIMAL(10,2) NOT NULL DEFAULT 0.00");
        await addColumnIfNotExists("rooms", "discount_price", "DECIMAL(10,2) NULL DEFAULT NULL");
        await addColumnIfNotExists("rooms", "extra_adult_price", "DECIMAL(10,2) NOT NULL DEFAULT 0.00");
        await addColumnIfNotExists("rooms", "extra_child_price", "DECIMAL(10,2) NOT NULL DEFAULT 0.00");

        // 2. Add starting_price column to properties table
        await addColumnIfNotExists("properties", "starting_price", "DECIMAL(10,2) NOT NULL DEFAULT 0.00");

        // 3. Add pricing override columns to inventory_calendar table
        await addColumnIfNotExists("inventory_calendar", "daily_price", "DECIMAL(10,2) NULL DEFAULT NULL");
        await addColumnIfNotExists("inventory_calendar", "daily_discount_price", "DECIMAL(10,2) NULL DEFAULT NULL");

        // 4. Create room_seasonal_rates Table
        await db.query(`
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
                KEY idx_room_seasonal_rates_room (room_id),
                KEY idx_room_seasonal_rates_property (property_id),
                KEY idx_room_seasonal_rates_dates (start_date, end_date),
                KEY idx_room_seasonal_rates_active (is_active, delete_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log("Pricing tables and columns initialized successfully.");
    } catch (error) {
        console.error("Error initializing pricing tables:", error);
    }
}

module.exports = { initializePricingTables };
