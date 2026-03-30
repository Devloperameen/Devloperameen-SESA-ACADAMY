import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

// Create transporter — uses SendGrid in production, Gmail/Mailtrap in dev
const createTransporter = () => {
    if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
        return nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY,
            },
        });
    }

    // Development: use Gmail App Password or Mailtrap
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

const sendEmail = async (options: EmailOptions): Promise<void> => {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || `SESA Platform <noreply@sesa.edu>`;

    try {
        await transporter.sendMail({
            from,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        logger.info(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error: any) {
        logger.error(`Failed to send email to ${options.to}: ${error.message}`);
        throw new Error('Email could not be sent. Please try again later.');
    }
};

// ── Email Templates ─────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
  .container { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); padding: 32px 40px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
  .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
  .body { padding: 36px 40px; color: #333; line-height: 1.7; }
  .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%); color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
  .note { background: #f0f4ff; border-left: 4px solid #1a237e; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #555; margin-top: 20px; }
  .footer { background: #f4f6fb; padding: 20px 40px; text-align: center; font-size: 12px; color: #999; }
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>SESA</h1><p>SafeEdu Learning Platform</p></div>
  <div class="body">${content}</div>
  <div class="footer">© ${new Date().getFullYear()} SESA Platform. All rights reserved.<br>If you didn't request this email, you can safely ignore it.</div>
</div>
</body>
</html>`;

// Verification Email
export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
    const verifyURL = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await sendEmail({
        to: email,
        subject: '✅ Verify Your SESA Account',
        html: baseTemplate(`
            <h2 style="margin-top:0">Welcome, ${name}! 🎉</h2>
            <p>Thank you for joining SESA — your journey to smarter learning starts now.</p>
            <p>Please verify your email address to activate your account:</p>
            <a href="${verifyURL}" class="btn">Verify My Email</a>
            <div class="note">⏰ This link expires in <strong>24 hours</strong>. If it expires, you can request a new one from the login page.</div>
        `),
    });
};

// Password Reset Email
export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
        to: email,
        subject: '🔐 Reset Your SESA Password',
        html: baseTemplate(`
            <h2 style="margin-top:0">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetURL}" class="btn">Reset My Password</a>
            <div class="note">⏰ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your password will remain unchanged.</div>
        `),
    });
};

// Welcome email after verification
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
    await sendEmail({
        to: email,
        subject: '🎓 Welcome to SESA — Let\'s Start Learning!',
        html: baseTemplate(`
            <h2 style="margin-top:0">Your account is active! 🚀</h2>
            <p>Hi ${name},</p>
            <p>Your email has been verified. You now have full access to SESA — explore courses, track your progress, earn certificates, and connect with instructors.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to My Dashboard</a>
        `),
    });
};

// Enrollment confirmation
export const sendEnrollmentConfirmation = async (email: string, name: string, courseTitle: string): Promise<void> => {
    await sendEmail({
        to: email,
        subject: `📚 Enrolled in "${courseTitle}"`,
        html: baseTemplate(`
            <h2 style="margin-top:0">Enrollment Confirmed! 📚</h2>
            <p>Hi ${name},</p>
            <p>You are now enrolled in <strong>${courseTitle}</strong>. Start learning at your own pace!</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Start Learning</a>
        `),
    });
};

// Payment confirmation
export const sendPaymentConfirmation = async (email: string, name: string, amount: number, currency: string, courseTitle: string): Promise<void> => {
    await sendEmail({
        to: email,
        subject: `💳 Payment Confirmed — ${courseTitle}`,
        html: baseTemplate(`
            <h2 style="margin-top:0">Payment Successful! ✅</h2>
            <p>Hi ${name},</p>
            <p>Your payment of <strong>${currency} ${amount}</strong> for <strong>${courseTitle}</strong> has been confirmed.</p>
            <p>You now have full access to the course. Happy learning!</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Course</a>
        `),
    });
};

// Manual payment under review
export const sendManualPaymentReceived = async (email: string, name: string, amount: string, gateway: string): Promise<void> => {
    await sendEmail({
        to: email,
        subject: '⏳ Payment Under Review — SESA',
        html: baseTemplate(`
            <h2 style="margin-top:0">Payment Receipt Received</h2>
            <p>Hi ${name},</p>
            <p>We have received your payment receipt of <strong>${amount}</strong> via <strong>${gateway}</strong>.</p>
            <p>Our team will verify your payment within <strong>24 hours</strong>. You will receive a confirmation email once approved.</p>
            <div class="note">📞 If you have any questions, contact us at support@sesa.edu.</div>
        `),
    });
};
