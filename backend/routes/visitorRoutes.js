import express from "express";
import { getVisitors, addVisitor } from "../controllers/visitorController.js";

const router = express.Router();

router.get("/", getVisitors);
router.post("/", addVisitor);

export default router;
