import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/auth.js';
import { getVerificationRequests, updateVerificationStatus, createVerificationRequest } from '../controllers/verificationController.js';

// Configure multer for verification document uploads
// We'll use temporary storage since the controller will move files to user-specific folders
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });

const router = express.Router();

// --- NEW ROUTE ---
// Handles front and back images
router.post('/', authenticate, upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 }
]), createVerificationRequest);


// --- Existing Routes ---
router.get('/', authenticate, getVerificationRequests);
router.put('/:id', authenticate, updateVerificationStatus);

export default router;
