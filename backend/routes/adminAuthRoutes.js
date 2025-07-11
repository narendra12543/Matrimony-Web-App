import express from "express";
import {
  adminRegister,
  adminLogin,
} from "../controllers/adminAuthController.js";
import { adminGetMe } from "../controllers/adminAuthController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const adminAuthRouter = express.Router();

adminAuthRouter.post("/register", adminRegister);
adminAuthRouter.post("/login", adminLogin);
adminAuthRouter.get("/me", authenticate, requireAdmin, adminGetMe);

export default adminAuthRouter;
