# ESMatrimonial - iOS Compatible Matrimonial Platform

A modern, responsive matrimonial platform with real-time chat, video calls, and comprehensive user management. **Now fully compatible with iOS devices!**

## 🚀 Features

- **Real-time Chat & Video Calls** - WebRTC-powered communication
- **User Authentication** - Secure login/registration with email verification
- **Profile Management** - Complete user profiles with photo uploads
- **Admin Dashboard** - Comprehensive admin panel for user management
- **Subscription Plans** - Premium features with payment integration
- **iOS Compatibility** - Optimized for iPhone and iPad Safari
- **Responsive Design** - Works seamlessly across all devices

## 📱 iOS Compatibility

This application has been specifically optimized for iOS devices with:

- ✅ **WebRTC Support** - Video/voice calls work on iOS Safari
- ✅ **Socket.IO Optimization** - Real-time features optimized for iOS
- ✅ **Touch Interactions** - Proper touch handling for iOS devices
- ✅ **Safe Area Support** - Respects iOS safe areas and notches
- ✅ **Viewport Optimization** - Proper scaling on all iOS devices
- ✅ **Performance Optimization** - Optimized bundle size and loading

### iOS Version Support
- **iOS 12+** - Full feature support
- **iOS 11** - Basic support (limited WebRTC)
- **iOS 10 and below** - Not supported

## 🛠️ Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- MongoDB
- iOS device for testing (recommended)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ESMatromonial
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Environment Setup**
```bash
# Create .env file in root directory
cp .env.example .env

# Edit .env with your configuration
# For iOS testing, ensure HTTPS is configured
```

4. **Database Setup**
```bash
# Start MongoDB
mongod

# Run database migrations (if any)
npm run db:migrate
```

5. **Start Development Servers**
```bash
# Start backend server
npm run dev

# In another terminal, start frontend
cd frontend
npm run dev
```

### iOS Testing Setup

For optimal iOS testing:

1. **Use the iOS deployment script**
```bash
chmod +x deploy-ios-test.sh
./deploy-ios-test.sh
```

2. **For HTTPS testing (recommended for iOS)**
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000
```

3. **Test on iOS device**
- Open Safari on your iPhone/iPad
- Navigate to the provided URL
- Test all features including video calls

## 🧪 Testing

### iOS Compatibility Test
```javascript
// Run comprehensive iOS compatibility test
import { runComprehensiveTest } from './frontend/src/utils/iosCompatibilityTest.js';

runComprehensiveTest().then(results => {
  console.log('Test results:', results);
});
```

### Manual Testing Checklist
- [ ] **Video Calls** - Test on iOS Safari
- [ ] **Voice Calls** - Test audio-only calls
- [ ] **Real-time Chat** - Test messaging features
- [ ] **Touch Interactions** - Test all buttons and gestures
- [ ] **Responsive Design** - Test in portrait and landscape
- [ ] **Performance** - Check loading times and smoothness

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/esmatrimonial
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=http://localhost:5000
VITE_IOS_COMPATIBILITY=true
```

### iOS-Specific Configuration

The application includes several iOS-specific optimizations:

1. **WebRTC Configuration**
   - iOS-specific getUserMedia constraints
   - Additional STUN servers for better connectivity
   - Fallback mechanisms for older iOS versions

2. **Socket.IO Configuration**
   - Polling-first transport for iOS Safari
   - Automatic reconnection handling
   - iOS-specific error handling

3. **CSS Optimizations**
   - Safe area support for notched devices
   - Touch interaction optimizations
   - Viewport height fixes for iOS Safari

## 📱 iOS Development Notes

### Key iOS Compatibility Features

1. **Video Element Attributes**
   ```html
   <video 
     playsInline 
     webkit-playsinline 
     autoplay 
     muted
     style="webkit-user-select: none;"
   />
   ```

2. **Touch Event Handling**
   ```css
   * {
     -webkit-tap-highlight-color: transparent;
     -webkit-touch-callout: none;
   }
   ```

3. **Safe Area Support**
   ```css
   .safe-area-top {
     padding-top: max(env(safe-area-inset-top), 0px);
   }
   ```

### Common iOS Issues and Solutions

1. **Video Calls Not Working**
   - Ensure HTTPS is enabled
   - Check microphone/camera permissions
   - Test with iOS 12+ devices

2. **Socket Connection Issues**
   - Verify CORS configuration
   - Check network connectivity
   - Test with different transport methods

3. **UI Layout Problems**
   - Use safe area insets
   - Test with different screen sizes
   - Check viewport meta tag

## 🚀 Deployment

### Production Build
```bash
# Build frontend for production
cd frontend
npm run build:ios

# Start production server
cd ..
npm start
```

### iOS-Specific Deployment Considerations

1. **HTTPS Requirement**
   - iOS Safari requires HTTPS for WebRTC
   - Configure SSL certificates properly
   - Use services like ngrok for testing

2. **Performance Optimization**
   - Minimize bundle size
   - Use CDN for static assets
   - Implement proper caching

3. **Testing on Real Devices**
   - Always test on actual iOS devices
   - Test different iOS versions
   - Test in various network conditions

## 📚 Documentation

- [iOS Compatibility Guide](./IOS_COMPATIBILITY_GUIDE.md) - Detailed iOS-specific documentation
- [API Documentation](./API_DOCS.md) - Backend API reference
- [Frontend Components](./FRONTEND_DOCS.md) - React component documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on iOS devices
5. Submit a pull request

### iOS Testing Requirements

When contributing, please ensure:
- [ ] Test on iOS Safari
- [ ] Test video/voice calls
- [ ] Test touch interactions
- [ ] Test responsive design
- [ ] No console errors on iOS

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For iOS-specific issues:
1. Check the [iOS Compatibility Guide](./IOS_COMPATIBILITY_GUIDE.md)
2. Run the compatibility test utility
3. Test on real iOS devices
4. Check Safari Web Inspector for errors

## 🎯 Roadmap

- [ ] PWA support for iOS
- [ ] Push notifications for iOS
- [ ] Enhanced video call quality
- [ ] iOS-specific UI improvements
- [ ] Offline support for iOS

---

**Note**: This application is specifically optimized for iOS devices and includes comprehensive testing and compatibility features. For the best experience, test on actual iOS devices running iOS 12 or later. 