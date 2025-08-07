import nodemailer from "nodemailer";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

// Rate limiting configuration
const EMAIL_RATE_LIMIT = {
  maxEmailsPerMinute: 10,
  maxEmailsPerHour: 100,
  emailsSent: [],
  lastReset: Date.now(),
};

// Reset rate limit counters
const resetRateLimit = () => {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const oneHour = 60 * 60 * 1000;

  EMAIL_RATE_LIMIT.emailsSent = EMAIL_RATE_LIMIT.emailsSent.filter(
    (timestamp) => {
      return now - timestamp < oneHour;
    }
  );

  EMAIL_RATE_LIMIT.lastReset = now;
};

// Check rate limit
const checkRateLimit = () => {
  resetRateLimit();

  const now = Date.now();
  const oneMinute = 60 * 1000;

  const emailsLastMinute = EMAIL_RATE_LIMIT.emailsSent.filter(
    (timestamp) => now - timestamp < oneMinute
  ).length;

  const emailsLastHour = EMAIL_RATE_LIMIT.emailsSent.length;

  if (emailsLastMinute >= EMAIL_RATE_LIMIT.maxEmailsPerMinute) {
    throw new Error("Rate limit exceeded: Too many emails per minute");
  }

  if (emailsLastHour >= EMAIL_RATE_LIMIT.maxEmailsPerHour) {
    throw new Error("Rate limit exceeded: Too many emails per hour");
  }

  return true;
};

// Record email sent
const recordEmailSent = () => {
  EMAIL_RATE_LIMIT.emailsSent.push(Date.now());
};

// Create transporter with retry logic
const createTransporter = () => {
  // Use Hostinger credentials as fallback if env not set
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const secure = process.env.EMAIL_SECURE;

  if (!user || !pass) {
    logger.error(
      "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env"
    );
    throw new Error("Email service not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Only for development, remove in production
    },
    // Add connection pooling and retry settings
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 5, // max messages per second
    rateDelta: 1000, // time window in milliseconds
  });

  transporter.verify(function (error, success) {
    if (error) {
      logger.error("Email transporter verification failed:", error);
    } else {
      logger.info("Email server is ready to send messages");
    }
  });

  return transporter;
};

// Generic email sending function with attachments support and retry logic
export const sendEmailWithAttachment = async (
  to,
  subject,
  html,
  attachments = []
) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check rate limit before sending
      checkRateLimit();

      const transporter = createTransporter();

      const mailOptions = {
        from: `"MatroMatch Admin" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments,
      };

      const result = await transporter.sendMail(mailOptions);

      // Record successful email
      recordEmailSent();

      logger.info(
        `Email sent successfully to ${to}. Message ID: ${result.messageId}`
      );
      return true;
    } catch (error) {
      lastError = error;

      // Log the specific error
      logger.error(
        `Email attempt ${attempt} failed for ${to}: ${error.message}`
      );

      // If it's a rate limit error, wait before retrying
      if (error.response && error.response.includes("Ratelimit")) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        logger.info(
          `Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else if (attempt < maxRetries) {
        // For other errors, wait a shorter time
        const waitTime = 1000 * attempt;
        logger.info(`Waiting ${waitTime}ms before retry ${attempt + 1}`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // If all retries failed, throw the last error
  logger.error(
    `All ${maxRetries} attempts failed for ${to}: ${lastError.message}`
  );
  throw lastError;
};

// Updated base template with modern, attractive design
const baseTemplate = (content, title, headerImage = false) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Montserrat', Arial, sans-serif;
      background-color: #f9f7f7;
      color: #333;
      line-height: 1.6;
    }
    
    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
    }
    
    .header {
      background: linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%);
      color: white;
      padding: 50px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80') center/cover;
      opacity: 0.15;
      pointer-events: none;
    }
    
    .header h1 {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header p {
      font-size: 18px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
      max-width: 80%;
      margin: 0 auto;
    }
    
    .content {
      padding: 45px;
    }
    
    .content h2 {
      color: #2d3748;
      margin-bottom: 25px;
      font-weight: 600;
      font-size: 26px;
      font-family: 'Playfair Display', serif;
    }
    
    .content p {
      color: #4a5568;
      margin-bottom: 25px;
      font-size: 16px;
      line-height: 1.7;
    }
    
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    
    .button {
      background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
      color: white;
      padding: 18px 36px;
      text-decoration: none;
      border-radius: 50px;
      display: inline-block;
      font-weight: 600;
      font-size: 17px;
      transition: all 0.3s ease;
      box-shadow: 0 10px 20px rgba(255, 117, 140, 0.25);
      position: relative;
      overflow: hidden;
    }
    
    .button:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 25px rgba(255, 117, 140, 0.35);
    }
    
    .button:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0));
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .button:hover:after {
      opacity: 1;
    }
    
    .link-text {
      color: #3a7bd5;
      word-break: break-all;
      font-size: 15px;
      margin: 25px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #3a7bd5;
      line-height: 1.5;
    }
    
    .info-box {
      margin-top: 35px;
      padding: 25px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #3a7bd5;
    }
    
    .info-box h3 {
      color: #2d3748;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 600;
      font-family: 'Playfair Display', serif;
    }
    
    .info-box ul {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.8;
      padding-left: 20px;
    }
    
    .info-box li {
      margin-bottom: 10px;
      position: relative;
    }
    
    .info-box li:before {
      content: '→';
      color: #ff758c;
      font-weight: bold;
      display: inline-block;
      width: 1em;
      margin-left: -1em;
    }
    
    .steps-box {
      background: linear-gradient(to right, #f8f9fa 0%, #ffffff 100%);
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
      border: 1px solid #e9ecef;
      position: relative;
      overflow: hidden;
    }
    
    .steps-box:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, #3a7bd5 0%, #00d2ff 100%);
    }
    
    .steps-box h3 {
      color: #2d3748;
      margin-bottom: 20px;
      font-size: 20px;
      font-family: 'Playfair Display', serif;
      display: flex;
      align-items: center;
    }
    
    .steps-box h3 svg {
      margin-right: 10px;
      color: #ff758c;
    }
    
    .steps-box ul {
      color: #4a5568;
      line-height: 1.8;
      padding-left: 25px;
    }
    
    .steps-box li {
      margin-bottom: 12px;
      position: relative;
      padding-left: 10px;
    }
    
    .steps-box li:before {
      content: "";
      position: absolute;
      left: -15px;
      top: 10px;
      width: 8px;
      height: 8px;
      background: #3a7bd5;
      border-radius: 50%;
    }
    
    .footer {
      background: #2d3748;
      color: white;
      padding: 25px;
      text-align: center;
      font-size: 14px;
    }
    
    .footer p {
      margin-bottom: 10px;
    }
    
    .social-links {
      margin: 20px 0;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: white;
      font-size: 18px;
      transition: all 0.3s;
    }
    
    .social-links a:hover {
      transform: translateY(-3px);
      color: #ff758c;
    }
    
    .couple-illustration {
      text-align: center;
      margin: 30px 0;
    }
    
    .couple-illustration img {
      max-width: 300px;
      height: auto;
    }
    
    .highlight-text {
      background: linear-gradient(135deg, #fff2cc 0%, #ffd966 100%);
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #ffb347;
    }
    
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      
      .header {
        padding: 40px 20px;
      }
      
      .header h1 {
        font-size: 30px;
      }
      
      .header p {
        font-size: 16px;
        max-width: 100%;
      }
      
      .content h2 {
        font-size: 22px;
      }
      
      .button {
        padding: 16px 30px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-overlay"></div>
      <h1>MatroMatch</h1>
      <p>${title}</p>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="#">Facebook</a>
        <a href="#">Instagram</a>
        <a href="#">Twitter</a>
        <a href="#">LinkedIn</a>
      </div>
      <p>© ${new Date().getFullYear()} MatroMatch. All rights reserved.</p>
      <p>123 Love Lane, Match City, MC 12345</p>
    </div>
  </div>
</body>
</html>
`;

// Updated welcome email with beautiful design
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    logger.info(`Attempting to send welcome email to ${email}`);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MatroMatch" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Matromatch - Your Journey Begins Here!",
      html: baseTemplate(
        `
        <div class="couple-illustration">
          <svg width="250" height="200" viewBox="0 0 250 200" xmlns="http://www.w3.org/2000/svg">
            <!-- Couple illustration SVG code would go here -->
          </svg>
        </div>
        
        <h2>Welcome to Your New Beginning, ${firstName}!</h2>
        <p>
          We're absolutely thrilled to have you join the MatroMatch family! 
          You've taken the first step toward finding your perfect life partner, 
          and we're here to make that journey beautiful and successful.
        </p>
        
        <div class="highlight-text">
          <p>
            <strong>Did you know?</strong> Members who complete their profiles within 
            3 days are <strong>5x more likely</strong> to find meaningful matches!
          </p>
        </div>
        
        <div class="steps-box">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Your Quick Start Guide
          </h3>
          <ul>
            <li><strong>Complete your profile</strong> - Add details about yourself, your lifestyle, and what you're looking for</li>
            <li><strong>Upload high-quality photos</strong> - Profiles with multiple photos receive 3x more interest</li>
            <li><strong>Set your preferences</strong> - Help us find your ideal matches</li>
            <li><strong>Explore potential matches</strong> - Start connecting with compatible partners</li>
            <li><strong>Verify your account</strong> - Get priority in search results</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="${process.env.CLIENT_URL}/dashboard" class="button">
            Complete Your Profile Now
          </a>
        </div>
        
        <p>
          We're committed to helping you find meaningful connections. 
          If you have any questions or need assistance, our support team is just an email away.
        </p>
        
        <div class="info-box">
          <h3>Need Help Getting Started?</h3>
          <ul>
            <li>Check out our <a href="#" style="color: #3a7bd5; text-decoration: none;">Getting Started Guide</a></li>
            <li>Watch our <a href="#" style="color: #3a7bd5; text-decoration: none;">Profile Optimization Tips</a> video</li>
            <li>Join our <a href="#" style="color: #3a7bd5; text-decoration: none;">weekly webinar</a> for new members</li>
          </ul>
        </div>
      `,
        "Welcome to Your Love Journey!"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(
      `Welcome email sent to ${email}. Message ID: ${result.messageId}`
    );
    return true;
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}: ${error.message}`);
    logger.error(`Email error details:`, error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

// Updated password reset email
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    logger.info(`Attempting to send password reset email to ${email}`);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MatroMatch Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - MatroMatch",
      html: baseTemplate(
        `
        <h2>Password Reset Request</h2>
        <p>
          We received a request to reset your MatroMatch account password. 
          Click the button below to securely create a new password.
        </p>
        
        <div class="button-container">
          <a href="${resetUrl}" class="button">
            Reset My Password
          </a>
        </div>
        
        <p>
          If you didn't request this password reset, you can safely ignore this email - 
          your account remains secure.
        </p>
        
        <p class="link-text">
          Or copy this link to your browser:<br>
          ${resetUrl}
        </p>
        
        <div class="info-box">
          <h3>For Your Security</h3>
          <ul>
            <li>This link expires in 1 hour</li>
            <li>Never share your password or this link with anyone</li>
            <li>Our team will never ask for your password</li>
            <li>After resetting, you'll be logged out of all devices</li>
          </ul>
        </div>
        
        <div class="highlight-text">
          <p>
            <strong>Tip:</strong> Choose a strong password that you don't use on other sites. 
            Consider using a password manager to keep your accounts secure.
          </p>
        </div>
      `,
        "Password Assistance"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(
      `Password reset email sent to ${email}. Message ID: ${result.messageId}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to send password reset email to ${email}: ${error.message}`
    );
    logger.error(`Email error details:`, error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Updated verification email
export const sendVerificationEmail = async (
  email,
  verificationToken,
  verificationUrl
) => {
  try {
    logger.info(`Attempting to send verification email to ${email}`);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MatroMatch" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Complete Your Registration",
      html: baseTemplate(
        `
        <div class="couple-illustration">
          <svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <!-- Verification illustration SVG would go here -->
          </svg>
        </div>
        
        <h2>One Last Step!</h2>
        <p>
          Welcome to MatroMatch! To complete your registration and start your journey, 
          please verify your email address by clicking the button below.
        </p>
        
        <div class="button-container">
          <a href="${verificationUrl}" class="button">
            Verify My Email
          </a>
        </div>
        
        <p class="link-text">
          Or paste this link into your browser:<br>
          ${verificationUrl}
        </p>
        
        <div class="steps-box">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Why Verify Your Email?
          </h3>
          <ul>
            <li><strong>Secure your account</strong> - Prevent unauthorized access</li>
            <li><strong>Get better matches</strong> - Verified profiles appear higher in search results</li>
            <li><strong>Receive important notifications</strong> - Never miss a potential match</li>
            <li><strong>Full access to features</strong> - Unlock all MatroMatch capabilities</li>
          </ul>
        </div>
        
        <div class="info-box">
          <h3>Having Trouble?</h3>
          <ul>
            <li>Link not working? Try copying it directly into your browser</li>
            <li>Check your spam folder if you don't see our emails</li>
            <li>Contact support if you need assistance</li>
          </ul>
        </div>
      `,
        "Verify Your Email Address"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(
      `Verification email sent to ${email}. Message ID: ${result.messageId}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to send verification email to ${email}: ${error.message}`
    );
    logger.error(`Email error details:`, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Send verification approval email
export const sendVerificationApprovalEmail = async (
  email,
  firstName,
  documentType
) => {
  try {
    logger.info(`Attempting to send verification approval email to ${email}`);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MatroMatch Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Your Document Verification Has Been Approved!",
      html: baseTemplate(
        `
        <div class="couple-illustration">
          <svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <!-- Success checkmark illustration -->
            <circle cx="100" cy="75" r="60" fill="#10b981" opacity="0.1"/>
            <path d="M70 75 L85 90 L130 45" stroke="#10b981" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <h2>Congratulations, ${firstName}! 🎉</h2>
        <p>
          Great news! Your <strong>${documentType}</strong> document has been successfully verified 
          and approved by our admin team. Your profile is now fully verified and will receive 
          priority visibility in search results.
        </p>
        
        <div class="highlight-text">
          <p>
            <strong>What this means for you:</strong>
          </p>
          <ul>
            <li>✅ Your profile appears higher in search results</li>
            <li>✅ Other members can see your verified status</li>
            <li>✅ Increased trust and credibility</li>
            <li>✅ Better matching opportunities</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="${process.env.CLIENT_URL}/dashboard" class="button">
            View Your Profile
          </a>
        </div>
        
        <div class="info-box">
          <h3>Next Steps</h3>
          <ul>
            <li>Complete your profile with additional details</li>
            <li>Upload more photos to increase your visibility</li>
            <li>Set your partner preferences</li>
            <li>Start exploring potential matches</li>
          </ul>
        </div>
        
        <p>
          Thank you for choosing MatroMatch. We're committed to helping you find 
          your perfect life partner!
        </p>
      `,
        "Document Verification Approved!"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(
      `Verification approval email sent to ${email}. Message ID: ${result.messageId}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to send verification approval email to ${email}: ${error.message}`
    );
    throw new Error(
      `Failed to send verification approval email: ${error.message}`
    );
  }
};

// Send verification rejection email
export const sendVerificationRejectionEmail = async (
  email,
  firstName,
  documentType,
  reason
) => {
  try {
    logger.info(`Attempting to send verification rejection email to ${email}`);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MatroMatch Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "⚠️ Document Verification Update",
      html: baseTemplate(
        `
        <div class="couple-illustration">
          <svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <!-- Attention illustration -->
            <circle cx="100" cy="75" r="60" fill="#f59e0b" opacity="0.1"/>
            <path d="M100 45 L100 85 M100 95 L100 105" stroke="#f59e0b" stroke-width="8" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        
        <h2>Hello ${firstName},</h2>
        <p>
          We've reviewed your <strong>${documentType}</strong> document submission, and unfortunately, 
          we couldn't approve it at this time. Don't worry - this is easily fixable!
        </p>
        
        <div class="highlight-text">
          <h3>Reason for Rejection:</h3>
          <p><strong>${reason}</strong></p>
        </div>
        
        <div class="steps-box">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            How to Fix This:
          </h3>
          <ul>
            <li>Ensure the document is clearly visible and not blurry</li>
            <li>Make sure all text is readable</li>
            <li>Upload the complete document (not cropped)</li>
            <li>Use original documents, not screenshots</li>
            <li>Ensure the document is not expired</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="${process.env.CLIENT_URL}/verification" class="button">
            Re-upload Document
          </a>
        </div>
        
        <div class="info-box">
          <h3>Need Help?</h3>
          <ul>
            <li>Check our <a href="#" style="color: #3a7bd5;">documentation guidelines</a></li>
            <li>Contact our support team for assistance</li>
            <li>Watch our <a href="#" style="color: #3a7bd5;">upload tutorial</a></li>
          </ul>
        </div>
        
        <p>
          We're here to help you get verified quickly. Once you re-upload your document, 
          we'll review it within 24 hours.
        </p>
      `,
        "Document Verification Update"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(
      `Verification rejection email sent to ${email}. Message ID: ${result.messageId}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to send verification rejection email to ${email}: ${error.message}`
    );
    throw new Error(
      `Failed to send verification rejection email: ${error.message}`
    );
  }
};

// Send profile approval email
export const sendProfileApprovalEmail = async (
  email,
  firstName,
  isNewUser = false
) => {
  try {
    logger.info(`Attempting to send profile approval email to ${email}`);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MatroMatch Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isNewUser
        ? "🎉 Welcome! Your Account Has Been Approved!"
        : "✅ Your Profile Changes Have Been Approved!",
      html: baseTemplate(
        `
        <div class="couple-illustration">
          <svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <!-- Success illustration -->
            <circle cx="100" cy="75" r="60" fill="#10b981" opacity="0.1"/>
            <path d="M70 75 L85 90 L130 45" stroke="#10b981" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <h2>${
          isNewUser ? "Welcome to MatroMatch, " : "Great news, "
        }${firstName}! 🎉</h2>
        <p>
          ${
            isNewUser
              ? "Your account registration has been successfully approved by our admin team. You're now ready to start your journey to find your perfect life partner!"
              : "Your profile changes have been reviewed and approved by our admin team. Your updated information is now live and visible to other members."
          }
        </p>
        
        <div class="highlight-text">
          <p>
            <strong>What's next:</strong>
          </p>
          <ul>
            <li>✅ Your profile is now active and visible</li>
            <li>✅ Start receiving personalized matches</li>
            <li>✅ Connect with potential partners</li>
            <li>✅ Access all premium features</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="${process.env.CLIENT_URL}/dashboard" class="button">
            ${isNewUser ? "Start Your Journey" : "View Your Profile"}
          </a>
        </div>
        
        ${
          isNewUser
            ? `
        <div class="steps-box">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Getting Started Guide
          </h3>
          <ul>
            <li><strong>Complete your profile</strong> - Add more details about yourself</li>
            <li><strong>Upload photos</strong> - Profiles with photos get 3x more interest</li>
            <li><strong>Set preferences</strong> - Help us find your ideal matches</li>
            <li><strong>Start exploring</strong> - Browse potential matches</li>
            <li><strong>Verify your account</strong> - Get priority in search results</li>
          </ul>
        </div>
        `
            : ""
        }
        
        <div class="info-box">
          <h3>Need Help?</h3>
          <ul>
            <li>Check out our <a href="#" style="color: #3a7bd5;">getting started guide</a></li>
            <li>Contact our support team for assistance</li>
            <li>Join our <a href="#" style="color: #3a7bd5;">community forum</a></li>
          </ul>
        </div>
        
        <p>
          Thank you for choosing MatroMatch. We're excited to help you find 
          your perfect life partner!
        </p>
      `,
        isNewUser ? "Welcome to MatroMatch!" : "Profile Changes Approved!"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(
      `Profile approval email sent to ${email}. Message ID: ${result.messageId}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to send profile approval email to ${email}: ${error.message}`
    );
    throw new Error(`Failed to send profile approval email: ${error.message}`);
  }
};

// Send profile rejection email
export const sendProfileRejectionEmail = async (
  email,
  firstName,
  reason,
  isNewUser = false
) => {
  try {
    logger.info(`Attempting to send profile rejection email to ${email}`);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MatroMatch Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isNewUser
        ? "⚠️ Account Registration Update"
        : "⚠️ Profile Changes Update",
      html: baseTemplate(
        `
        <div class="couple-illustration">
          <svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <!-- Attention illustration -->
            <circle cx="100" cy="75" r="60" fill="#f59e0b" opacity="0.1"/>
            <path d="M100 45 L100 85 M100 95 L100 105" stroke="#f59e0b" stroke-width="8" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        
        <h2>Hello ${firstName},</h2>
        <p>
          ${
            isNewUser
              ? "We've reviewed your account registration, and unfortunately, we couldn't approve it at this time."
              : "We've reviewed your profile changes, and unfortunately, we couldn't approve them at this time."
          }
        </p>
        
        <div class="highlight-text">
          <h3>Reason for Rejection:</h3>
          <p><strong>${reason}</strong></p>
        </div>
        
        <div class="steps-box">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            How to Resolve This:
          </h3>
          <ul>
            <li>Review and correct the information mentioned above</li>
            <li>Ensure all details are accurate and up-to-date</li>
            <li>Follow our community guidelines</li>
            <li>Contact support if you need clarification</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="${process.env.CLIENT_URL}/profile" class="button">
            ${isNewUser ? "Update Registration" : "Update Profile"}
          </a>
        </div>
        
        <div class="info-box">
          <h3>Need Help?</h3>
          <ul>
            <li>Review our <a href="#" style="color: #3a7bd5;">community guidelines</a></li>
            <li>Contact our support team for assistance</li>
            <li>Check our <a href="#" style="color: #3a7bd5;">FAQ section</a></li>
          </ul>
        </div>
        
        <p>
          We're here to help you get approved quickly. Once you make the necessary changes, 
          we'll review your ${
            isNewUser ? "registration" : "profile"
          } within 24 hours.
        </p>
      `,
        isNewUser ? "Account Registration Update" : "Profile Changes Update"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(
      `Profile rejection email sent to ${email}. Message ID: ${result.messageId}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Failed to send profile rejection email to ${email}: ${error.message}`
    );
    throw new Error(`Failed to send profile rejection email: ${error.message}`);
  }
};
