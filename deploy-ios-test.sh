#!/bin/bash

# iOS Testing Deployment Script
# This script helps deploy the application for iOS testing

echo "🚀 Starting iOS Testing Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating default .env..."
    cat > .env << EOF
# iOS Testing Environment Variables
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=http://localhost:5000
VITE_IOS_COMPATIBILITY=true
EOF
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend for iOS
echo "🔨 Building frontend for iOS compatibility..."
cd frontend
npm install
npm run build:ios

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

cd ..

# Start backend server
echo "🖥️  Starting backend server..."
npm start &

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend development server
echo "🌐 Starting frontend development server..."
cd frontend
npm run dev &

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 3

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is running"
else
    echo "❌ Frontend server failed to start"
    exit 1
fi

cd ..

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📱 iOS Testing URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo ""
echo "🔧 For iOS testing:"
echo "   1. Make sure your iOS device is on the same network"
echo "   2. Replace 'localhost' with your computer's IP address"
echo "   3. For HTTPS testing, use ngrok or similar service"
echo ""
echo "📋 Testing Checklist:"
echo "   ☐ Test on iOS Safari"
echo "   ☐ Test video calls"
echo "   ☐ Test real-time chat"
echo "   ☐ Test responsive design"
echo "   ☐ Test touch interactions"
echo ""
echo "🛑 To stop servers, press Ctrl+C"

# Keep script running
wait 