// Cloudinary configuration
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded
dotenv.config();

// Configure Cloudinary with error checking
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Debug logging
console.log('Cloudinary config attempt:');
console.log('cloud_name:', cloudinaryConfig.cloud_name);
console.log('api_key:', cloudinaryConfig.api_key ? 'Set' : 'Missing');
console.log('api_secret:', cloudinaryConfig.api_secret ? 'Set' : 'Missing');

// Check if all required environment variables are present
const hasCloudinaryCredentials = cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret;

if (!hasCloudinaryCredentials) {
  console.warn('⚠️  Cloudinary credentials are missing. Using local file storage as fallback.');
  console.warn('To use Cloudinary, add these to your .env file:');
  console.warn('CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name');
  console.warn('CLOUDINARY_API_KEY=your_cloudinary_api_key');
  console.warn('CLOUDINARY_API_SECRET=your_cloudinary_api_secret');
} else {
  cloudinary.config(cloudinaryConfig);
  console.log('✅ Cloudinary configured successfully with cloud name:', cloudinaryConfig.cloud_name);
}

// Create storage based on availability of Cloudinary credentials
let uploadFile;

if (hasCloudinaryCredentials) {
  // Cloudinary storage
  uploadFile = multer({
    storage: new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        // Determine folder based on file type
        let folder = 'files';
        let resourceType = 'auto';
        
        if (file.mimetype.startsWith('image/')) {
          folder = 'images';
          resourceType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          folder = 'videos';
          resourceType = 'video';
        } else {
          folder = 'documents';
          resourceType = 'raw';
        }

        return {
          folder: `Matrimony/chat/${folder}`,
          resource_type: resourceType,
          allowed_formats: resourceType === 'image' ? ['jpg', 'jpeg', 'png', 'gif', 'webp'] : undefined,
          transformation: resourceType === 'image' ? [
            { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
          ] : undefined,
        };
      },
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
      // Allow all file types for now
      cb(null, true);
    }
  });
} else {
  // Local storage fallback
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  uploadFile = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
      // Allow all file types for now
      cb(null, true);
    }
  });
}

export { uploadFile };
export default cloudinary;
