import express from 'express';
import {
  sendRequest,
  getUserRequests,
  respondToRequest,
  getRequestDetails,
} from '../controllers/requestController.js';
import { authenticate, requireUser } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and user role
router.use(authenticate);
router.use(requireUser);

// Send a connection request
router.post('/send', sendRequest);

// Get all requests for current user
router.get('/my-requests', getUserRequests);

// Respond to a request
router.put('/respond/:requestId', respondToRequest);

// Get request details
router.get('/:requestId', getRequestDetails);

export default router; 