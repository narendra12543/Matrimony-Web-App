# Matrimony Backend

A comprehensive backend for a modern matrimonial platform, built with Node.js, Express, and MongoDB. This backend supports user profiles, advanced matching, messaging, video calls, subscriptions, and an admin dashboard.

## Features

- **User Authentication**: JWT-based authentication, password hashing, and refresh tokens.
- **Profile Management**: Rich user profiles with preferences, photos, and verification.
- **Matching Algorithm**: Suggests matches based on user preferences and profile data.
- **Messaging**: Real-time chat using Socket.io.
- **Video/Audio Calls**: WebRTC integration for secure calls (signaling via Socket.io).
- **Subscription Plans**: Paid plans with Stripe/Razorpay integration.
- **Admin Dashboard**: User management, verification, and analytics.
- **Security**: Helmet, CORS, rate limiting, and role-based access control.
- **File Uploads**: Cloudinary for images/videos, Multer for handling uploads.
- **Email Service**: Nodemailer/SendGrid for notifications and verification.
- **Logging**: Morgan and Winston for request and error logging.

## Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** (Mongoose ODM)
- **Socket.io** (real-time)
- **WebRTC** (video/audio calls)
- **Razorpay** (payments)
- **Cloudinary** (file storage)
- **Nodemailer** (email)
- **Multer**, **bcryptjs**, **validator**, **dotenv**, **helmet**, **morgan**, **winston**

## Project Structure

```
matrimony-backend/
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   ├── passport.js
│   └── constants.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── matchController.js
│   ├── messageController.js
│   ├── callController.js
│   ├── visitorController.js
│   ├── subscriptionController.js
│   └── adminController.js
├── models/
│   ├── User.js
│   ├── Match.js
│   ├── Message.js
│   ├── Call.js
│   ├── Visitor.js
│   ├── Plan.js
│   └── Notification.js
├── middleware/
│   ├── auth.js
│   ├── roles.js
│   ├── errorHandler.js
│   ├── upload.js
│   └── validation.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── matchRoutes.js
│   ├── messageRoutes.js
│   ├── callRoutes.js
│   ├── visitorRoutes.js
│   ├── subscriptionRoutes.js
│   └── adminRoutes.js
├── services/
│   ├── authService.js
│   ├── userService.js
│   ├── matchService.js
│   ├── messageService.js
│   ├── callService.js
│   ├── paymentService.js
│   ├── notificationService.js
│   └── emailService.js
├── utils/
│   ├── helpers.js
│   ├── logger.js
│   ├── socket.js
│   ├── webrtc.js
│   └── validator.js
├── public/
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
└── server.js
```

## API Endpoints

### Authentication Routes

- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login
- `POST /api/auth/forgot-password` — Password reset request
- `POST /api/auth/reset-password/:token` — Password reset
- `GET /api/auth/me` — Get current user profile
- `POST /api/auth/refresh-token` — Refresh access token
- `POST /api/auth/logout` — User logout

### User Routes

- `GET /api/users` — Get all users (with filters)
- `GET /api/users/:id` — Get single user profile
- `PUT /api/users/:id` — Update user profile
- `DELETE /api/users/:id` — Delete user account
- `POST /api/users/upload-photo` — Upload profile photo
- `POST /api/users/upload-documents` — Upload verification documents
- `GET /api/users/suggestions` — Get match suggestions
- `GET /api/users/search` — Search users with filters

### Match/Interest Routes

- `POST /api/matches/send-interest/:userId` — Send interest to another user
- `GET /api/matches/received-interests` — Get received interests
- `GET /api/matches/sent-interests` — Get sent interests
- `PUT /api/matches/respond-interest/:interestId` — Accept/reject interest
- `GET /api/matches/matches` — Get all mutual matches

### Message Routes

- `GET /api/messages/conversations` — Get all conversations
- `GET /api/messages/:userId` — Get messages with specific user
- `POST /api/messages/send/:userId` — Send message to user
- `PUT /api/messages/mark-read/:messageId` — Mark message as read

### Call Routes

- `POST /api/calls/initiate` — Initiate a call
- `POST /api/calls/end` — End a call
- `GET /api/calls/history` — Get call history

### Visitor Routes

- `GET /api/visitors` — Get profile visitors
- `POST /api/visitors/track` — Track profile visit

### Subscription Routes

- `GET /api/subscriptions/plans` — Get all subscription plans
- `GET /api/subscriptions/my-plan` — Get current user's subscription
- `POST /api/subscriptions/subscribe` — Create new subscription
- `POST /api/subscriptions/webhook` — Payment webhook handler
- `PUT /api/subscriptions/cancel` — Cancel subscription

### Admin Routes

- `POST /api/admin/login` — Admin login
- `GET /api/admin/users` — Get all users (admin)
- `PUT /api/admin/users/:id/verify` — Verify user profile
- `PUT /api/admin/users/:id/status` — Change user account status
- `GET /api/admin/stats` — Get platform statistics
- `POST /api/admin/plans` — Create new subscription plan
- `PUT /api/admin/plans/:id` — Update subscription plan
- `DELETE /api/admin/plans/:id` — Delete subscription plan

## Real-time Features (Socket.io Events)

### Connection Events

- `user-online` — Notify when user comes online
- `user-offline` — Notify when user goes offline

### Message Events

- `new-message` — Send new message to recipient
- `message-read` — Notify sender that message was read

### Call Events

- `call-initiated` — Notify recipient of incoming call
- `call-accepted` — Notify caller that call was accepted
- `call-rejected` — Notify caller that call was rejected
- `call-ended` — Notify both parties that call ended
- `call-signal` — WebRTC signaling data exchange

### Notification Events

- `new-interest` — Notify user of new interest/match
- `interest-accepted` — Notify user their interest was accepted
- `new-visitor` — Notify user of new profile visitor

## Getting Started

1. **Clone the repository**
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your credentials (MongoDB URI, JWT secret,Razorpay keys, Cloudinary, etc.)
4. **Run the server**
   ```sh
   npm start
   ```

## Scripts

- `npm start` — Start the server
- `npm run dev` — Start in development mode (with nodemon)
- `npm test` — Run tests

## Contribution

Feel free to open issues or submit pull requests for improvements and bug fixes.

## License

MIT

## Environment Variables (.env)

For security reasons, the `.env` file is not included in the repository. You must create your own `.env` file in the project root with the following variables:

      PORT=5000
      MONGO_URI=your_mongodb_connection_string
      JWT_SECRET=your_jwt_secret
      ADMIN_JWT_SECRET=your_admin_jwt_secret
      RAZORPAY_KEY=your_razorpay_key
      RAZORPAY_SECRET=your_razorpay_secret
      CLOUDINARY_URL=your_cloudinary_url

- Replace `your_mongodb_connection_string` with your MongoDB URI.
- Replace `your_jwt_secret` and `your_admin_jwt_secret` with strong, random strings.
- Replace Cloudinary values if you use image uploads.

**Note:** Never commit your `.env` file to version control.
