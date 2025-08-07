# Frontend Upload System Updates

## Overview

This document outlines all the frontend updates made to integrate with the new backend upload system that uses unique user IDs (MM####) and local file storage.

## New Upload Service

### `frontend/src/services/uploadService.js`

A centralized service that handles all file uploads with the following features:

#### Key Features:

- **Categorized Uploads**: Different endpoints for profile, chat, and verification files
- **Progress Tracking**: Real-time upload progress callbacks
- **Preview URLs**: Automatic preview generation for images and videos
- **Memory Management**: Automatic cleanup of blob URLs
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### Available Methods:

```javascript
// Profile uploads
uploadProfilePhoto(file, onProgress);
uploadProfileDocument(file, onProgress);

// Chat uploads
uploadChatImage(file, onProgress);
uploadChatVideo(file, onProgress);
uploadChatDocument(file, onProgress);

// Verification uploads
uploadVerificationDocument(file, documentType, side, onProgress);

// File management
deleteFile(filePath);
getStorageStats();
getFileUrl(filePath);
createPreviewUrl(file);
revokePreviewUrl(url);
```

## Updated Components

### 1. Chat File Upload (`frontend/src/components/Chat/FileUpload.jsx`)

#### Changes Made:

- ✅ Replaced direct axios calls with `uploadService`
- ✅ Added file type categorization (image/video/document)
- ✅ Added preview functionality for uploaded files
- ✅ Added progress tracking with visual progress bar
- ✅ Added file management (preview, send, remove)
- ✅ Added memory cleanup for preview URLs

#### New Features:

- **Preview Panel**: Shows uploaded files before sending
- **File Type Icons**: Visual indicators for different file types
- **Progress Tracking**: Real-time upload progress
- **File Actions**: Preview, send, and remove options

### 2. Verification Suite (`frontend/src/components/User/Verification_Suite/UserVerificationSuite.jsx`)

#### Changes Made:

- ✅ Updated to use new verification upload endpoints
- ✅ Added file validation (type and size)
- ✅ Added preview functionality for document images
- ✅ Added progress tracking
- ✅ Improved UI with better file selection interface

#### New Features:

- **File Validation**: Checks file type and size (max 5MB)
- **Document Preview**: Preview images before upload
- **Progress Tracking**: Visual upload progress
- **Better UI**: Improved file selection and upload interface

### 3. Profile Creation (`frontend/src/components/User/User_Profile/CreateProfile.jsx`)

#### Changes Made:

- ✅ Updated photo upload to use new profile photo endpoint
- ✅ Added file validation
- ✅ Added preview functionality
- ✅ Added progress tracking
- ✅ Updated file deletion to use new service

#### New Features:

- **Photo Validation**: Checks file type and size
- **Preview URLs**: Preview photos before upload
- **Progress Tracking**: Visual upload progress
- **Memory Management**: Automatic cleanup of preview URLs

## New Backend Endpoints

The frontend now uses these new categorized endpoints:

### Profile Uploads

- `POST /api/v1/upload/profile/photo` - Profile photos
- `POST /api/v1/upload/profile/document` - Profile documents

### Chat Uploads

- `POST /api/v1/upload/chat/image` - Chat images
- `POST /api/v1/upload/chat/video` - Chat videos
- `POST /api/v1/upload/chat/document` - Chat documents

### Verification Uploads

- `POST /api/v1/upload/verification/aadhaar` - Aadhaar cards
- `POST /api/v1/upload/verification/passport` - Passports
- `POST /api/v1/upload/verification/driver-license` - Driver licenses

### File Management

- `DELETE /api/v1/upload/file` - Delete files
- `GET /api/v1/upload/storage/stats` - Get storage statistics

## File Storage Structure

Files are now stored in a structured format:

```
uploads/
├── users/
│   └── MM1001/
│       ├── profile/
│       │   ├── photos/
│       │   └── documents/
│       ├── chat/
│       │   ├── images/
│       │   ├── videos/
│       │   └── documents/
│       └── verification/
│           ├── aadhaar/
│           ├── passport/
│           └── driver-license/
└── temp/
```

## File Naming Convention

Files are named with a structured format:

- **Profile Photos**: `MM1001_profile_photo_001.jpg`
- **Chat Images**: `MM1001_chat_image_2024-01-15T143022.jpg`
- **Verification Documents**: `MM1001_verification_aadhaar_front.pdf`

## Preview Functionality

### Image/Video Previews

- Uses `URL.createObjectURL()` for instant previews
- Automatic cleanup with `URL.revokeObjectURL()`
- Preview before upload for better UX

### File URLs

- Uses `uploadService.getFileUrl()` for server-stored files
- Opens in new tab for full-size viewing

## Error Handling

### Upload Errors

- File type validation
- File size limits (5MB max)
- Network error handling
- Authentication error handling

### User Feedback

- Toast notifications for success/error
- Progress indicators
- Clear error messages

## Testing Checklist

### Chat File Upload

- [ ] Upload image file
- [ ] Upload video file
- [ ] Upload document file
- [ ] Preview uploaded files
- [ ] Send files in chat
- [ ] Remove uploaded files
- [ ] Check progress tracking

### Verification Upload

- [ ] Select document type
- [ ] Upload Aadhaar card
- [ ] Upload passport
- [ ] Upload driver license
- [ ] Preview document before upload
- [ ] Check upload progress
- [ ] Verify file storage location

### Profile Photo Upload

- [ ] Upload profile photo
- [ ] Preview photo before upload
- [ ] Check upload progress
- [ ] Delete photo
- [ ] Verify file storage location

### General Testing

- [ ] Check file size limits
- [ ] Check file type validation
- [ ] Test error handling
- [ ] Verify memory cleanup
- [ ] Check unique ID generation

## Migration Notes

### Backward Compatibility

- Legacy upload endpoint (`/api/v1/upload`) is still available
- Old file URLs will continue to work
- Gradual migration to new endpoints

### Database Updates

- New users get unique IDs automatically
- Existing users need to run migration script
- File paths updated to new structure

## Performance Improvements

### Memory Management

- Automatic cleanup of blob URLs
- Efficient preview generation
- Reduced memory leaks

### Upload Optimization

- Progress tracking for better UX
- File validation before upload
- Categorized storage for better organization

## Security Considerations

### File Validation

- File type checking
- File size limits
- Malicious file detection

### Access Control

- Authentication required for all uploads
- User-specific file access
- Secure file serving

## Future Enhancements

### Planned Features

- Drag and drop upload
- Bulk file upload
- Image compression
- Video thumbnail generation
- File sharing between users

### Optimization Opportunities

- CDN integration
- Image optimization
- Caching strategies
- Background upload processing
