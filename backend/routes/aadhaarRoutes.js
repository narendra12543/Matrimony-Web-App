import express from "express";
import multer from "multer";

const router = express.Router();

// Setup Multer
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Aadhaar Route
router.post("/verify-aadhaar", upload.single("aadhaar"), (req, res) => {
  const file = req.file;

  console.log("📂 Aadhaar File Received:", file?.originalname);
  console.log("📥 Request Headers:", req.headers);

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Simulate verification
  const verified = Math.random() > 0.2;
  const uid = "XXXX-YYYY-ZZZZ";

  console.log("✅ Responding with:", { verified, uid });

  return res.json({ verified, uid });
});

export default router;
