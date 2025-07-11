// Email templates and sending
import nodemailer from "nodemailer";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.error("Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env");
    throw new Error("Email service not configured");
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  transporter.verify(function(error, success) {
    if (error) {
      logger.error("Email transporter verification failed:", error);
    } else {
      logger.info("Email server is ready to send messages");
    }
  });

  return transporter;
};

// Base template with common styles and structure
const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Poppins', Arial, sans-serif;
      background-color: #f5f7fa;
      color: #333;
      line-height: 1.6;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('https://example.com/pattern.png') center/cover;
      opacity: 0.1;
      pointer-events: none;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
      position: relative;
      z-index: 1;
      animation: fadeInDown 0.6s ease-out;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
      animation: fadeIn 0.8s ease-out 0.2s both;
    }
    
    .content {
      padding: 40px;
    }
    
    .content h2 {
      color: #2d3748;
      margin-bottom: 20px;
      font-weight: 600;
      animation: fadeIn 0.6s ease-out;
    }
    
    .content p {
      color: #4a5568;
      margin-bottom: 20px;
      animation: fadeIn 0.6s ease-out 0.2s both;
    }
    
    .button-container {
      text-align: center;
      margin: 30px 0;
      animation: fadeIn 0.6s ease-out 0.4s both;
    }
    
    .button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 30px;
      display: inline-block;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    
    .button:hover {
      transform: translateY(-3px);
      box-shadow: 0 7px 20px rgba(102, 126, 234, 0.4);
    }
    
    .link-text {
      color: #667eea;
      word-break: break-all;
      font-size: 14px;
      margin: 20px 0;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #667eea;
      animation: fadeIn 0.6s ease-out 0.3s both;
    }
    
    .info-box {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #edf2f7;
      animation: fadeIn 0.6s ease-out 0.5s both;
    }
    
    .info-box h3 {
      color: #718096;
      font-size: 14px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .info-box ul {
      color: #4a5568;
      font-size: 14px;
      line-height: 1.8;
      padding-left: 20px;
    }
    
    .footer {
      background: #2d3748;
      color: white;
      padding: 20px;
      text-align: center;
      font-size: 14px;
    }
    
    .steps-box {
      background: white;
      padding: 25px;
      border-radius: 10px;
      margin: 25px 0;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
      animation: fadeIn 0.6s ease-out 0.3s both;
    }
    
    .steps-box h3 {
      color: #2d3748;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    
    .steps-box ul {
      color: #4a5568;
      line-height: 1.8;
      padding-left: 25px;
    }
    
    .steps-box li {
      margin-bottom: 8px;
      position: relative;
    }
    
    .steps-box li::before {
      content: '•';
      color: #667eea;
      font-weight: bold;
      display: inline-block;
      width: 1em;
      margin-left: -1em;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      
      .header {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>ESMatrimonial</h1>
      <p>${title}</p>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ESMatrimonial. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    logger.info(`Attempting to send password reset email to ${email}`);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - ESMatrimonial",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">ESMatrimonial</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You requested a password reset for your ESMatrimonial account. 
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                <strong>Important:</strong>
              </p>
              <ul style="color: #666; font-size: 14px; line-height: 1.6;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, this link can only be used once</li>
                <li>After reset, you'll be redirected to the login page</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">© 2024 ESMatrimonial. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}. Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
    logger.error(`Email error details:`, error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    logger.info(`Attempting to send welcome email to ${email}`);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ESMatrimonial" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to ESMatrimonial!",
      html: baseTemplate(`
        <h2>Welcome, ${firstName}!</h2>
        <p>
          Thank you for joining ESMatrimonial! We're excited to help you find your perfect match.
        </p>
        
        <div class="steps-box">
          <h3>🎯 Next Steps:</h3>
          <ul>
            <li>Complete your profile to get better matches</li>
            <li>Upload your photos to increase visibility</li>
            <li>Set your partner preferences</li>
            <li>Start exploring potential matches</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="button">
            Complete Your Profile
          </a>
        </div>
        
        <p>
          If you have any questions, feel free to reply to this email. Our team is happy to help!
        </p>
      `, "Welcome to our community!"),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}. Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}: ${error.message}`);
    logger.error(`Email error details:`, error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

// Send verification email
export const sendVerificationEmail = async (email, verificationToken, verificationUrl) => {
  try {
    logger.info(`Attempting to send verification email to ${email}`);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ESMatrimonial" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - ESMatrimonial",
      html: baseTemplate(`
        <h2>Verify Your Email</h2>
        <p>
          Please verify your email address to complete your registration and unlock login access.
        </p>
        
        <div class="button-container">
          <a href="${verificationUrl}" class="button">
            Verify Email
          </a>
        </div>
        
        <p>
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p class="link-text">
          ${verificationUrl}
        </p>
        
        <div class="info-box">
          <h3>Important:</h3>
          <ul>
            <li>This link will expire in 24 hours</li>
            <li>You must verify your email before you can login</li>
            <li>After verification, you'll be redirected to the login page</li>
          </ul>
        </div>
      `, "Email Verification"),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}. Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}: ${error.message}`);
    logger.error(`Email error details:`, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};