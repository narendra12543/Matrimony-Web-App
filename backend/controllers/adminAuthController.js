import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export const adminRegister = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Required fields missing" });
    }
    const existing = await Admin.findOne({ email });
    if (existing) {
      logger.warn(
        `Admin registration failed: Email already registered (${email})`
      );
      return res.status(409).json({ error: "Email already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hash, name });
    const adminData = await admin.save();
    const token = jwt.sign(
      {
        id: adminData._id,
        email: adminData.email,
        name: adminData.name,
        admin: true,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );
    logger.info(`Admin registered: ${email}`);
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    logger.error(
      `Admin registration error for ${req.body.email}: ${err.message}`
    );
    res.status(500).json({ error: "Server error" });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      logger.warn(`Admin login failed: No admin found for ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      logger.warn(`Admin login failed: Wrong password for ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name, admin: true },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );
    logger.info(`Admin login: ${email}`);
    res.json({ token, admin: { ...admin.toObject(), password: undefined } });
  } catch (err) {
    logger.error(`Admin login error for ${req.body.email}: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

export const adminGetMe = async (req, res) => {
  try {
    const admin = await Admin.findById(
      req.admin.id,
      "-password -verificationDocuments"
    );
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
