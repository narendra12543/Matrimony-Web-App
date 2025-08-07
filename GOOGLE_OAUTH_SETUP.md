# Google OAuth Setup Guide

## Environment Variables Required

### Backend (.env file in backend directory)

```env
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback

# Client URL (Frontend URL)
CLIENT_URL=https://yourdomain.com

# Server Configuration
PORT=5000
```

### Frontend (.env file in frontend directory)

```env
# Backend API URL
VITE_API_URL=https://yourdomain.com/api/v1
VITE_BACKEND_URL=https://yourdomain.com
```

## Google OAuth Setup Steps

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://yourdomain.com/api/v1/auth/google/callback`
     - `http://localhost:5000/api/v1/auth/google/callback` (for development)
5. **Copy the credentials**:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

## Domain Configuration

### For Production:
- `GOOGLE_CALLBACK_URL=https://matromatch.com/api/v1/auth/google/callback`
- `CLIENT_URL=https://matromatch.com`

### For Development:
- `GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback`
- `CLIENT_URL=http://localhost:5173`

## Testing the Setup

1. Start your backend server
2. Start your frontend development server
3. Try logging in with Google
4. Check the console logs for any errors

## Common Issues

1. **500 Internal Server Error**: Usually means missing environment variables
2. **Invalid redirect URI**: Make sure the callback URL matches exactly in Google Console
3. **CORS errors**: Ensure your CORS configuration includes your frontend domain

## Debugging

The updated code now includes detailed logging. Check your backend console for:
- 🔐 Google OAuth initiated
- 📝 Query params
- 🌐 Environment check
- 🔄 Google OAuth callback received
- ✅ Google OAuth successful
- ❌ Error messages 