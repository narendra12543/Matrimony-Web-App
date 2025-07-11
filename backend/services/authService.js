import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "yoursecret";
const JWT_EXPIRES_IN = "7d";

export const registerUser = async ({
  email,
  password,
  firstName,
  lastName,
  phone,
  terms,
  ...rest
}) => {
  if (!email || !password || !firstName || !lastName || !phone) {
    throw new Error("Required fields missing");
  }
  if (!terms) {
    throw new Error("You must accept the terms and conditions");
  }
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already registered");
  const hash = await bcrypt.hash(password, 10);
  
  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationTokenHash = crypto.createHash("sha256").update(emailVerificationToken).digest("hex");
  
  const user = new User({
    email,
    password: hash,
    firstName,
    lastName,
    phone,
    emailVerificationToken: emailVerificationTokenHash,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    ...rest,
  });
  const userData = await user.save();
  const token = jwt.sign(
    { id: userData._id, email: userData.email, name: userData.name },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
  return { userData, token, emailVerificationToken };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");
  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
  return { token, user };
};
