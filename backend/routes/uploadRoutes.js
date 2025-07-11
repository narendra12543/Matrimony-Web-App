import express from 'express';
import { uploadFile } from '../config/cloudinary.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Upload file endpoint
router.post('/', authenticate, (req, res) => {
  uploadFile.single('file')(req, res, async (err) => {
    try {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          message: 'File upload failed', 
          error: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File uploaded successfully:', req.file);

      const fileData = {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        format: req.file.format || req.file.mimetype?.split('/')[1],
        resourceType: req.file.resource_type || 'auto',
        size: req.file.bytes || req.file.size,
        width: req.file.width,
        height: req.file.height,
        storage: process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local'
      };

      res.json({
        message: 'File uploaded successfully',
        file: fileData
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Upload failed', 
        error: error.message 
      });
    }
  });
});

// Get file info endpoint
router.get('/info/:publicId', authenticate, async (req, res) => {
  try {
    const { publicId } = req.params;
    res.json({ publicId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get file info' });
  }
});

export default router; 