const db = require("../../config/db");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
    try {
        const first_name = req.body?.first_name?.toString().trim();
        const last_name = req.body?.last_name?.toString().trim();
        const phone = req.body?.phone?.toString().trim();
        const email = req.body?.email?.toString().trim().toLowerCase();
        const password = req.body?.password?.toString();

        // Validation
        if (!first_name || !last_name || !phone || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if email already exists
        const [existingUser] = await db.query(
            "SELECT p_owner_id FROM property_owners WHERE email = ? OR phone = ?",
            [email, phone]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User with this email or phone number already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        await db.query(
            `INSERT INTO property_owners
            (first_name, last_name, phone, email, password)
            VALUES (?, ?, ?, ?, ?)`,
            [first_name, last_name, phone, email, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: "Property owner registered successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    registerUser
};
