import express from "express";
import {
  getInactiveUsers,
  updateUserAction,
  sendReminderEmail,
  getInactiveStats,
} from "../controllers/inactiveuserController.js";

const router = express.Router();

router.get("/inactive", getInactiveUsers);
router.post("/action/:id", updateUserAction);
router.post("/send-email/:id", sendReminderEmail);
router.get("/inactive-stats", getInactiveStats);

export default router;
