import nodemailer from 'nodemailer';
import { createHash, randomBytes } from 'crypto';

// Configure email transporter
// For development, we can use ethereal.email (a fake SMTP service)
// For production, replace with real SMTP settings
let transporter: nodemailer.Transporter;

/**
 * Initialize email transporter
 * This should be called at app startup
 */
export async function initEmailService() {
  // In development, use Ethereal (fake SMTP service)
  if (process.env.NODE_ENV !== 'production') {
    // Create a test account on ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    // Create a transporter using the test account
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('Ethereal Email configured for development');
    console.log(`Test account: ${testAccount.user}`);
  } else {
    // In production, use real SMTP settings
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    console.log('Email service configured for production');
  }
}

/**
 * Generate a verification token
 */
export function generateVerificationToken(): string {
  // Generate a random string
  const randomString = randomBytes(32).toString('hex');
  
  // Create a hash of the random string
  return createHash('sha256').update(randomString).digest('hex');
}

/**
 * Send a verification email
 */
export async function sendVerificationEmail(
  email: string, 
  name: string, 
  verificationToken: string
): Promise<{ success: boolean; messageUrl?: string }> {
  try {
    // Generate the verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    // Create mail options
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Florida Insurance" <${process.env.SMTP_FROM || 'no-reply@floridainsurance.com'}>`,
      to: email,
      subject: 'Verify Your Email Address',
      text: `Hello ${name},\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nIf you did not create an account, please ignore this email.\n\nThanks,\nFlorida Insurance Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Verify Your Email Address</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with Florida Insurance Claims Assistant. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0284c7; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Email Address
            </a>
          </p>
          <p>If the button above doesn't work, you can also click on the link below or copy it into your browser:</p>
          <p style="word-break: break-all; font-size: 14px; color: #666;">
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Thanks,<br>Florida Insurance Team</p>
        </div>
      `,
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      // For development, return the Ethereal URL to preview the email
      console.log('Verification email sent. Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return { 
        success: true, 
        messageUrl: nodemailer.getTestMessageUrl(info) as string 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false };
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string, 
  name: string, 
  resetToken: string
): Promise<{ success: boolean; messageUrl?: string }> {
  try {
    // Generate the reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    // Create mail options
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Florida Insurance" <${process.env.SMTP_FROM || 'no-reply@floridainsurance.com'}>`,
      to: email,
      subject: 'Reset Your Password',
      text: `Hello ${name},\n\nYou requested to reset your password. Please click the link below to set a new password:\n\n${resetUrl}\n\nIf you did not request a password reset, please ignore this email.\n\nThanks,\nFlorida Insurance Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Reset Your Password</h2>
          <p>Hello ${name},</p>
          <p>You requested to reset your password. Please click the button below to set a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p>If the button above doesn't work, you can also click on the link below or copy it into your browser:</p>
          <p style="word-break: break-all; font-size: 14px; color: #666;">
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thanks,<br>Florida Insurance Team</p>
        </div>
      `,
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      // For development, return the Ethereal URL to preview the email
      console.log('Password reset email sent. Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return { 
        success: true, 
        messageUrl: nodemailer.getTestMessageUrl(info) as string 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false };
  }
} 