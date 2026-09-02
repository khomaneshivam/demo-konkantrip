const db = require("../../config/db");
const { getMailTransporter } = require("../../services/notificationService");

/**
 * POST /api/v1/webhooks/whatsapp
 * Receives WhatsApp delivery, read, and failure status callbacks
 */
const whatsappWebhook = async (req, res) => {
    try {
        const body = req.body || {};
        console.log("WhatsApp Webhook Payload Received:", JSON.stringify(body));

        // Meta Cloud API or generic WhatsApp webhook structure
        const entry = body.entry?.[0]?.changes?.[0]?.value;
        const statuses = entry?.statuses;

        if (Array.isArray(statuses) && statuses.length > 0) {
            for (const s of statuses) {
                const providerMsgId = s.id;
                const status = (s.status || "").toUpperCase(); // 'SENT', 'DELIVERED', 'READ', 'FAILED'

                if (providerMsgId) {
                    await db.query(
                        `UPDATE notification_messages 
                         SET delivery_status = CASE 
                             WHEN ? = 'READ' THEN 'READ'
                             WHEN ? = 'DELIVERED' AND delivery_status != 'READ' THEN 'DELIVERED'
                             WHEN ? = 'SENT' AND delivery_status NOT IN ('DELIVERED', 'READ') THEN 'SENT'
                             WHEN ? = 'FAILED' THEN 'FAILED'
                             ELSE delivery_status 
                         END,
                         delivered_at = CASE WHEN ? IN ('DELIVERED', 'READ') AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
                         last_error = CASE WHEN ? = 'FAILED' THEN ? ELSE last_error END
                         WHERE provider_message_id = ?`,
                        [status, status, status, status, status, status, JSON.stringify(s.errors || {}), providerMsgId]
                    );
                }
            }
        } else if (body.provider_message_id && body.status) {
            // Direct simulator / test webhook
            const normalizedStatus = String(body.status).toUpperCase();
            await db.query(
                `UPDATE notification_messages 
                 SET delivery_status = ?, 
                     delivered_at = CASE WHEN ? IN ('DELIVERED', 'READ') THEN NOW() ELSE delivered_at END
                 WHERE provider_message_id = ?`,
                [normalizedStatus, normalizedStatus, body.provider_message_id]
            );
        }

        return res.status(200).json({ success: true, message: "Webhook processed successfully" });
    } catch (error) {
        console.error("Error processing WhatsApp webhook:", error);
        return res.status(500).json({ success: false, message: "Failed to process webhook" });
    }
};

/**
 * POST /api/v1/notifications/test-email
 * Quick test endpoint for verifying email SMTP delivery via Swagger UI
 */
const testEmail = async (req, res) => {
    try {
        const { to_email, subject = "KonkanTrip Test Email", message = "This is a test notification from KonkanTrip OTA system." } = req.body || {};

        if (!to_email) {
            return res.status(400).json({ success: false, message: "Recipient 'to_email' is required" });
        }

        const transporter = await getMailTransporter();
        const fromAddr = process.env.SMTP_FROM || `"KonkanTrip" <${process.env.SMTP_USER || "shivamkhomane4@gmail.com"}>`;

        const sendResult = await transporter.sendMail({
            from: fromAddr,
            to: to_email,
            subject,
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #047857;">KonkanTrip Notification</h2>
                <p>${message.replace(/\n/g, "<br/>")}</p>
                <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
                <small style="color: #64748b;">Automated system message from KonkanTrip OTA Platform</small>
            </div>`
        });

        return res.status(200).json({
            success: true,
            message: `Email dispatched successfully to ${to_email}`,
            data: {
                messageId: sendResult.messageId,
                response: sendResult.response || "Sent"
            }
        });
    } catch (error) {
        console.error("Error sending test email:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to send email" });
    }
};

/**
 * GET /api/v1/notifications/logs
 * Fetches recent notification dispatch audit logs
 */
const getNotificationLogs = async (req, res) => {
    try {
        const { booking_id, limit = 50 } = req.query;
        let query = "SELECT * FROM notification_messages";
        const params = [];

        if (booking_id) {
            query += " WHERE booking_id = ?";
            params.push(booking_id);
        }

        query += " ORDER BY created_at DESC LIMIT ?";
        params.push(Number(limit));

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching notification logs:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch notification logs" });
    }
};

module.exports = {
    whatsappWebhook,
    testEmail,
    getNotificationLogs
};
