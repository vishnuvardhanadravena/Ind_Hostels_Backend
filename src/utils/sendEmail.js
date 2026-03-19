const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const sitename = process.env.SITE_NAME;

// Configure Nodemailer transporter for Hostinger SMTP
let transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Hostinger SMTP server
    port: 465, // Secure port for Hostinger
    secure: true, // Use SSL (for port 465)
    auth: {
        user: process.env.SMTP_USER, // Your Hostinger email (set in .env)
        pass: process.env.SMTP_PASS,  // Your Hostinger email password (set in .env)
    },
    tls: {
        rejectUnauthorized: false, // Ignore self-signed certificate (if needed for development)
    }
});
//Sending Registration OTP for the user : 
exports.sendEmail = async (options) => {
    // Email options
    const mailOptions = {
        from: `"support@${sitename}.com" <${process.env.EMAIL_FROM}>`,   // Sender email (your Hostinger email)
        to: options.to,                 // Recipient email
        subject: options.subject,       // Subject of the email
        html: options.text,             // Email body (HTML content)
    };

    // Add attachments if provided
    if (options.attachments && Array.isArray(options.attachments)) {
        mailOptions.attachments = options.attachments;
    }

    if (!mailOptions.to) {
        console.error("Error: No recipient email provided.");
        return;
    }

    try {
        // 1. Send the email via Hostinger SMTP
        await transporter.sendMail(mailOptions);
        console.log({
            success: true,
            message: 'Email sent successfully',
            responseCode: 200
        });
    } catch (error) {
        console.error("Error sending email: ", error);
    }
};
