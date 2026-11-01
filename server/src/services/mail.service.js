import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

class MailService {
  constructor() {
    this.transporter = null;
    this.initPromise = null;
  }

  async getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    if (!this.initPromise) {
      this.initPromise = this.initTransport();
    }

    return this.initPromise;
  }

  async initTransport() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      return this.transporter;
    }

    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return this.transporter;
  }

  async sendPasswordResetEmail(toEmail, resetToken) {
    const transporter = await this.getTransporter();
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #09090b; letter-spacing: -0.025em;">Password Reset Request</h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                You requested a password reset for your Logistics Platform account. Click the button below to choose a new password. This link is valid for 1 hour.
              </p>
              <div style="margin: 0 0 24px 0; text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <div style="border-top: 1px solid #f4f4f5; padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; color: #a1a1aa; word-break: break-all;">
                  Or copy and paste this link in your browser: <a href="${resetUrl}" style="color: #09090b;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Logistics Platform" <no-reply@logistics.platform>',
      to: toEmail,
      subject: 'Reset Your Password - Logistics Platform',
      text: `Reset your password by following this link: ${resetUrl}`,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: ' + previewUrl);
    }

    return info;
  }

  async sendDeliveryConfirmationEmail(toEmail, orderDetails) {
    const transporter = await this.getTransporter();
    const { customerName, deliveryAddress, actualArrival, courierName } = orderDetails;

    const formattedTime = actualArrival
      ? new Date(actualArrival).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Order Has Been Delivered</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <div style="display: inline-block; background-color: #ecfdf5; color: #059669; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
                DELIVERED
              </div>
              <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #09090b; letter-spacing: -0.025em;">Delivery Confirmation</h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Hello <strong>${customerName || 'Valued Customer'}</strong>, your package has been successfully delivered!
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e4e4e7; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #71717a; width: 140px;">Customer:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; font-weight: 600; color: #09090b;">${customerName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #71717a;">Delivery Address:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; font-weight: 600; color: #09090b;">${deliveryAddress || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #71717a;">Delivery Time:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; font-weight: 600; color: #09090b;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #71717a;">Delivered by:</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #09090b;">${courierName || 'Fleet Driver'}</td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #a1a1aa; text-align: center;">
                Thank you for choosing Logistics Platform services!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Logistics Platform" <no-reply@logistics.platform>',
      to: toEmail,
      subject: `Delivery Confirmation - Order Delivered`,
      text: `Hello ${customerName}, your delivery to ${deliveryAddress} was completed at ${formattedTime} by ${courierName}.`,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: ' + previewUrl);
    }

    return info;
  }
}

export const mailService = new MailService();
