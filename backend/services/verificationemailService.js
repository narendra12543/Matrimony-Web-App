import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function sendEmailWithAttachment(to, subject, html, attachments = []) {
  const senderName = process.env.EMAIL_FROM_NAME || 'MatroMatch';

  const mailOptions = {
    from: `"${senderName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Nodemailer Error:', error);
    throw error;
  }
}
