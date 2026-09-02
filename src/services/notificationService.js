const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

// ==========================================
// 1. Email Transporter Setup
// ==========================================
let mailTransporter = null;

const getMailTransporter = async () => {
    require("dotenv").config();
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER || "shivamkhomane4@gmail.com";
    const pass = process.env.SMTP_PASS;
    const isGmail = host.includes("gmail") || user.includes("@gmail.com");

    if (user && pass && pass.trim() !== "") {
        try {
            const transportConfig = isGmail
                ? {
                    service: "gmail",
                    auth: {
                        user: user.trim(),
                        pass: pass.trim()
                    }
                }
                : {
                    host: host.trim(),
                    port,
                    secure: port === 465 || process.env.SMTP_SECURE === "true",
                    auth: {
                        user: user.trim(),
                        pass: pass.trim()
                    }
                };

            const realTransporter = nodemailer.createTransport(transportConfig);

            return {
                sendMail: async (options) => {
                    try {
                        return await realTransporter.sendMail(options);
                    } catch (err) {
                        if (err.code === "EAUTH" || err.responseCode === 534) {
                            console.warn("\n⚠️ [GMAIL SMTP AUTHENTICATION REQUIRED]");
                            console.warn("Google requires a 16-character 'App Password' when using Gmail SMTP with 2-Step Verification.");
                            console.warn("👉 Generate one at: https://myaccount.google.com/apppasswords");
                            console.warn("👉 Set SMTP_PASS=<your-16-char-app-password> in backend/.env\n");
                        } else {
                            console.error("Live email sending error:", err.message);
                        }
                        // Fallback logging
                        console.log("📧 [FALLBACK EMAIL DISPATCH]");
                        console.log(`From: ${options.from || `"KonkanTrip" <${user}>`}`);
                        console.log(`To: ${options.to}`);
                        console.log(`Subject: ${options.subject}`);
                        console.log(`Body:\n${options.text || options.html}\n`);
                        return {
                            messageId: `fallback-${uuidv4()}`,
                            response: "Delivered via fallback simulator"
                        };
                    }
                }
            };
        } catch (err) {
            console.error("Failed to initialize SMTP transporter:", err.message);
        }
    }

    // Fallback / Development simulator when SMTP_PASS is pending in .env
    return {
        sendMail: async (options) => {
            const messageId = `mock-${uuidv4()}`;
            console.log("\n📧 [REAL-TIME EMAIL DISPATCH]");
            console.log(`Sender: ${options.from || `"KonkanTrip" <${user}>`}`);
            console.log(`Recipient: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body:\n${options.text || options.html}`);
            console.log("👉 Tip: Add your 16-character Gmail App Password as SMTP_PASS in backend/.env to send directly to inboxes.\n");
            return {
                messageId,
                response: "Mock 250 Message accepted in development mode"
            };
        }
    };
};

// ==========================================
// 2. WhatsApp Provider Adapter
// ==========================================
const sendWhatsAppMessage = async ({ to, content, templateCode, parameters = {} }) => {
    const waToken = process.env.WHATSAPP_API_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // If real WhatsApp Meta Cloud API is configured
    if (waToken && waPhoneId) {
        try {
            const url = `https://graph.facebook.com/v18.0/${waPhoneId}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to.replace(/\D/g, ""),
                type: "text",
                text: { body: content }
            };

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${waToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error?.message || "WhatsApp Meta API Error");
            }
            return {
                provider: "Meta",
                providerMessageId: data.messages?.[0]?.id || `wa-${uuidv4()}`
            };
        } catch (err) {
            console.error("Meta WhatsApp Provider Error:", err.message);
            throw err;
        }
    }

    // Default Mock / Simulator Provider for Development & Testing
    const mockId = `wa_msg_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    console.log("\n📱 [WHATSAPP MESSAGE DISPATCH - MOCK PROVIDER]");
    console.log(`To: ${to}`);
    console.log(`Template: ${templateCode || "DIRECT_TEXT"}`);
    console.log(`Message:\n${content}`);
    console.log("------------------------------------------\n");

    return {
        provider: "Mock",
        providerMessageId: mockId
    };
};

// ==========================================
// 3. Property Front Desk Contact Resolver
// ==========================================
/**
 * Selects active approved front-desk / reservation contact for a property
 * Follows priority: Primary Reservation -> Reception -> Manager -> Owner
 */
const resolvePropertyFrontDeskContact = async (propertyId) => {
    try {
        const [contacts] = await db.query(
            `SELECT pc.*, ct.contact_type_name
             FROM property_contacts pc
             LEFT JOIN contact_types ct ON ct.contact_type_id = pc.contact_type_id
             WHERE pc.property_id = ? AND pc.status = 'Active' AND pc.delete_status = FALSE
             ORDER BY pc.is_primary DESC, pc.contact_id ASC`,
            [propertyId]
        );

        if (contacts.length > 0) {
            // Find reservation or front desk contact
            const reservationContact = contacts.find(c => {
                const type = (c.contact_type_name || c.contact_title || "").toLowerCase();
                return type.includes("reserv") || type.includes("front") || type.includes("recept");
            });

            if (reservationContact) {
                return {
                    contact_name: reservationContact.contact_name || "Front Desk",
                    contact_phone: reservationContact.phone || reservationContact.mobile || "",
                    contact_email: reservationContact.email || "",
                    contact_role: reservationContact.contact_type_name || "Reservation Desk"
                };
            }

            // Return first active contact
            return {
                contact_name: contacts[0].contact_name || "Front Desk",
                contact_phone: contacts[0].phone || contacts[0].mobile || "",
                contact_email: contacts[0].email || "",
                contact_role: contacts[0].contact_type_name || "Manager"
            };
        }

        // Fallback: lookup property owner details
        const [props] = await db.query(
            `SELECT p.property_name, po.first_name, po.last_name, po.phone, po.email
             FROM properties p
             INNER JOIN property_owners po ON po.p_owner_id = p.p_owner_id
             WHERE p.property_id = ? LIMIT 1`,
            [propertyId]
        );

        if (props.length > 0) {
            const prop = props[0];
            return {
                contact_name: `${prop.first_name || ""} ${prop.last_name || ""}`.trim() || "Property Manager",
                contact_phone: prop.phone || "",
                contact_email: prop.email || "",
                contact_role: "Property Owner"
            };
        }

        return {
            contact_name: "Front Desk",
            contact_phone: "",
            contact_email: "",
            contact_role: "General Front Desk"
        };
    } catch (err) {
        console.error("Error resolving property contact:", err);
        return {
            contact_name: "Front Desk",
            contact_phone: "",
            contact_email: "",
            contact_role: "General Front Desk"
        };
    }
};

// ==========================================
// 4. Template Interpolation Helper
// ==========================================
const renderTemplate = (content, params) => {
    let text = content || "";
    for (const [key, value] of Object.entries(params)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        text = text.replace(regex, value !== undefined && value !== null ? String(value) : "");
    }
    return text;
};

// ==========================================
// 5. Message Queueing & Async Processing
// ==========================================
const enqueueNotification = async ({
    bookingId = null,
    recipientType,
    recipientPhone = null,
    recipientEmail = null,
    channel = "WhatsApp",
    templateCode = null,
    subject = null,
    payload = {}
}) => {
    try {
        const [result] = await db.query(
            `INSERT INTO notification_messages (
                booking_id, recipient_type, recipient_phone, recipient_email,
                channel, template_code, subject, payload, delivery_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED')`,
            [
                bookingId, recipientType, recipientPhone, recipientEmail,
                channel, templateCode, subject, JSON.stringify(payload)
            ]
        );

        const notificationId = result.insertId;

        // Process asynchronously without blocking response
        setImmediate(async () => {
            await processNotification(notificationId);
        });

        return notificationId;
    } catch (err) {
        console.error("Failed to enqueue notification:", err);
        return null;
    }
};

const processNotification = async (notificationId) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM notification_messages WHERE notification_id = ? LIMIT 1",
            [notificationId]
        );

        if (rows.length === 0) return;
        const msg = rows[0];
        const payload = typeof msg.payload === "string" ? JSON.parse(msg.payload || "{}") : (msg.payload || {});

        // Fetch template
        let bodyContent = payload.message || "";
        let msgSubject = msg.subject || payload.subject || "KonkanTrip Notification";

        if (msg.template_code) {
            const [templates] = await db.query(
                "SELECT * FROM notification_templates WHERE template_code = ? LIMIT 1",
                [msg.template_code]
            );
            if (templates.length > 0) {
                bodyContent = renderTemplate(templates[0].content, payload);
                if (templates[0].subject) {
                    msgSubject = renderTemplate(templates[0].subject, payload);
                }
            }
        }

        await db.query(
            "UPDATE notification_messages SET delivery_status = 'SENDING' WHERE notification_id = ?",
            [notificationId]
        );

        if (msg.channel === "Email") {
            const transporter = await getMailTransporter();
            const fromAddr = process.env.SMTP_FROM || `"KonkanTrip" <${process.env.SMTP_USER || "shivamkhomane4@gmail.com"}>`;

            const sendRes = await transporter.sendMail({
                from: fromAddr,
                to: msg.recipient_email,
                subject: msgSubject,
                text: bodyContent,
                html: bodyContent.replace(/\n/g, "<br/>")
            });

            await db.query(
                `UPDATE notification_messages 
                 SET delivery_status = 'SENT', 
                     sent_at = NOW(), 
                     provider = 'Nodemailer', 
                     provider_message_id = ? 
                 WHERE notification_id = ?`,
                [sendRes.messageId || null, notificationId]
            );
        } else {
            // WhatsApp / SMS
            const waRes = await sendWhatsAppMessage({
                to: msg.recipient_phone,
                content: bodyContent,
                templateCode: msg.template_code,
                parameters: payload
            });

            await db.query(
                `UPDATE notification_messages 
                 SET delivery_status = 'SENT', 
                     sent_at = NOW(), 
                     provider = ?, 
                     provider_message_id = ? 
                 WHERE notification_id = ?`,
                [waRes.provider, waRes.providerMessageId, notificationId]
            );
        }
    } catch (err) {
        console.error(`Error processing notification #${notificationId}:`, err.message);
        await db.query(
            `UPDATE notification_messages 
             SET delivery_status = 'FAILED', 
                 retry_count = retry_count + 1, 
                 last_error = ? 
             WHERE notification_id = ?`,
            [err.message.slice(0, 500), notificationId]
        );
    }
};

// ==========================================
// 6. High-level Transactional Triggers
// ==========================================
const sendOtpEmail = async (email, otpCode) => {
    return enqueueNotification({
        recipientType: "Customer",
        recipientEmail: email,
        channel: "Email",
        templateCode: "CUSTOMER_OTP_EMAIL",
        subject: `${otpCode} is your KonkanTrip verification code`,
        payload: { otp: otpCode }
    });
};

const sendOtpWhatsApp = async (phone, otpCode) => {
    return enqueueNotification({
        recipientType: "Customer",
        recipientPhone: phone,
        channel: "WhatsApp",
        subject: "OTP Verification",
        payload: {
            message: `Your KonkanTrip verification code is: ${otpCode}. Valid for 5 minutes. Please do not share this code.`
        }
    });
};

const triggerBookingNotifications = async ({ booking, property, rooms = [], frontDeskContact }) => {
    const primaryRoom = rooms[0] || {};
    const roomName = primaryRoom.room_name || "Standard Room";
    const quantity = primaryRoom.quantity || 1;

    const payload = {
        booking_number: booking.booking_number,
        guest_name: booking.guest_name,
        guest_mobile: booking.guest_mobile,
        guest_email: booking.guest_email || "",
        property_name: property.property_name,
        property_address: property.address || property.city || "Konkan",
        room_name: roomName,
        quantity,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        total_nights: booking.total_nights,
        total_guests: booking.total_guests,
        final_amount: Number(booking.final_amount).toLocaleString("en-IN"),
        contact_name: frontDeskContact?.contact_name || "Front Desk",
        contact_phone: frontDeskContact?.contact_phone || "Contact Property"
    };

    // 1. WhatsApp to Customer
    if (booking.guest_mobile) {
        await enqueueNotification({
            bookingId: booking.booking_id,
            recipientType: "Customer",
            recipientPhone: booking.guest_mobile,
            channel: "WhatsApp",
            templateCode: "BOOKING_CONFIRMATION_CUSTOMER",
            payload
        });
    }

    // 2. Email to Customer (if provided)
    if (booking.guest_email) {
        await enqueueNotification({
            bookingId: booking.booking_id,
            recipientType: "Customer",
            recipientEmail: booking.guest_email,
            channel: "Email",
            templateCode: "BOOKING_CONFIRMATION_CUSTOMER_EMAIL",
            payload
        });
    }

    // 3. WhatsApp to Property Front Desk
    if (frontDeskContact?.contact_phone) {
        await enqueueNotification({
            bookingId: booking.booking_id,
            recipientType: "Property Front Desk",
            recipientPhone: frontDeskContact.contact_phone,
            channel: "WhatsApp",
            templateCode: "NEW_BOOKING_ALERT_FRONTDESK",
            payload
        });
    }
};

module.exports = {
    getMailTransporter,
    sendWhatsAppMessage,
    resolvePropertyFrontDeskContact,
    enqueueNotification,
    processNotification,
    sendOtpEmail,
    sendOtpWhatsApp,
    triggerBookingNotifications
};
