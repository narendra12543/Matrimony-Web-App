// backend/services/verificationService.js

import * as Jimp from "jimp"; // UPDATED: Changed the import statement for Jimp
import QrCode from "qrcode-reader";
import Tesseract from "tesseract.js";
import path from "path";

// --- Tesseract OCR Analysis (from your Script 2) ---
async function analyzeImageWithOCR(filePath, userName) {
  let score = 0;
  let ocrText = '';
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, "eng");
    ocrText = text;

    const criteria = [
      { pattern: /Government of India/i, weight: 3 },
      { pattern: /Aadhaar/i, weight: 2 },
      { pattern: /\b\d{4}\s\d{4}\s\d{4}\b/, weight: 3 }, // Aadhaar number format
      { pattern: /Year of Birth/i, weight: 1 },
      { pattern: /Male|Female|Transgender/i, weight: 1 }
    ];

    criteria.forEach(c => {
      if (c.pattern.test(text)) score += c.weight;
    });

    if (userName) {
      const nameRegex = new RegExp(userName.split(' ')[0], "i"); // Check for first name
      if (nameRegex.test(text)) {
        score += 2;
      }
    }
  } catch (err) {
    console.error("Tesseract OCR failed:", err);
  }
  return { score, ocrText };
}

// --- QR Code Analysis (from your Script 1) ---
async function analyzeImageWithQRCode(filePath) {
  let qrData = null;
  try {
    const image = await Jimp.read(filePath);
    const qr = new QrCode();
    const value = await new Promise((resolve, reject) => {
      qr.callback = (err, value) => err != null ? reject(err) : resolve(value);
      qr.decode(image.bitmap);
    });
    qrData = value.result;
  } catch (err) {
    console.log("QR Code reading failed or no QR code found.");
  }
  return qrData;
}


// --- Main Processing Function ---
export const processVerificationDocument = async (filePath, user) => {
  const absolutePath = path.resolve(filePath);
  let vulnerabilityScore = 10; // Start with the highest vulnerability
  const extractedData = {};

  // 1. Run OCR Analysis
  const { score: ocrScore, ocrText } = await analyzeImageWithOCR(absolutePath, user.name);
  vulnerabilityScore -= ocrScore;
  extractedData.ocrText = ocrText.substring(0, 500); // Store a snippet

  // 2. Run QR Code Analysis
  const qrData = await analyzeImageWithQRCode(absolutePath);
  if (qrData) {
    vulnerabilityScore -= 3; // Big confidence boost if QR is present and readable
    extractedData.qrData = qrData.substring(0, 500); // Store a snippet
    
    // Check if user's name is in the QR data (highly reliable)
    if (user.name && qrData.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) {
        vulnerabilityScore -= 3; // Another big boost
    }
  }

  // Ensure score is within 0-10 bounds
  if (vulnerabilityScore < 0) vulnerabilityScore = 0;
  if (vulnerabilityScore > 10) vulnerabilityScore = 10;

  return {
    vulnerabilityScore: Math.round(vulnerabilityScore),
    extractedData,
  };
};
