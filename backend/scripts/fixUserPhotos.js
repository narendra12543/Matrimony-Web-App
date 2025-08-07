import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixUserPhotos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ uniqueId: 'MM1002' });
    if (!user) {
      console.log('User MM1002 not found');
      return;
    }
    
    console.log('Before fix - Photos array:', user.photos);
    
    // Filter out null, undefined, and empty string values
    const cleanedPhotos = user.photos.filter(photo => 
      photo !== null && 
      photo !== undefined && 
      photo !== '' && 
      photo.trim() !== ''
    );
    
    console.log('After cleaning - Photos array:', cleanedPhotos);
    
    // Update the user's photos array
    user.photos = cleanedPhotos;
    await user.save();
    
    console.log('✅ User photos array updated successfully');
    
    // Also check if there are any other photos in the directory that should be added
    const fs = await import('fs');
    const path = await import('path');
    
    const photosDir = path.join(process.cwd(), 'uploads/users/MM1002/profile/photos');
    if (fs.existsSync(photosDir)) {
      const files = fs.readdirSync(photosDir);
      console.log('\nPhotos in directory:', files);
      
      // Check if any photos in directory are missing from user's photos array
      const missingPhotos = files.filter(file => {
        const photoPath = `/uploads/users/MM1002/profile/photos/${file}`;
        return !cleanedPhotos.includes(photoPath);
      });
      
      if (missingPhotos.length > 0) {
        console.log('\nMissing photos from user array:', missingPhotos);
        
        // Add missing photos to user's array
        missingPhotos.forEach(file => {
          const photoPath = `/uploads/users/MM1002/profile/photos/${file}`;
          if (!user.photos.includes(photoPath)) {
            user.photos.push(photoPath);
          }
        });
        
        await user.save();
        console.log('✅ Added missing photos to user array');
      }
    }
    
    console.log('\nFinal photos array:', user.photos);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

fixUserPhotos(); 