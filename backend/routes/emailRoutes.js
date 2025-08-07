import express from 'express';
import multer from 'multer';
import {
    sendEmail,
    getSentEmails,
    getSubscribers,
    updateSubscriberPreferences
} from '../controllers/emailController.js';

// Configure multer for newsletter attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });

const router = express.Router();

// Email routes
router.post('/send', upload.array('attachments'), sendEmail);
router.get('/history', getSentEmails);

// Subscriber routes
router.get('/subscribers', getSubscribers);
router.put('/subscribers/:id', updateSubscriberPreferences);

export default router;