import express from "express";
import { getVisitors, addVisitor } from "../controllers/visitorController.js";
import { authenticate } from '../middleware/auth.js';
import { checkFeatureAccess } from '../middleware/subscriptionCheck.js';

const router = express.Router();

router.get("/", authenticate, checkFeatureAccess('profileVisits'), getVisitors);
router.post("/", authenticate, addVisitor);

export default router;
