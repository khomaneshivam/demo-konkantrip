const db = require("../../config/db");
const bcrypt = require("bcrypt");

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body || {};
        const userId = req.user?.p_owner_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password, new password, and confirm password are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        const [rows] = await db.query(
            "SELECT password FROM property_owners WHERE p_owner_id = ? AND delete_status = FALSE",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property owner not found"
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, rows[0].password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE property_owners SET password = ? WHERE p_owner_id = ? AND delete_status = FALSE",
            [hashedPassword, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    updatePassword
};
