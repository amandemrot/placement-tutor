const router = require("express").Router();
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { cloudinary, cloudinaryEnabled } = require("../utils/cloudinary");
const User = require("../models/User");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/upload/verification  (field: "doc")
router.post("/verification", protect, upload.single("doc"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    let url;
    if (cloudinaryEnabled()) {
      const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(b64, {
        folder: "pt-tutor/verification",
        resource_type: "auto",
      });
      url = result.secure_url;
    } else {
      url = `dev://uploaded/${Date.now()}_${req.file.originalname}`;
      console.log(`📎 [DEV MODE] Would upload to Cloudinary: ${req.file.originalname}`);
    }

    await User.updateOne(
      { _id: req.user._id },
      { $set: { "mentorProfile.verificationDoc": url } }
    );

    res.json({ message: "Document uploaded", url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// POST /api/upload/photo  (field: "photo")
router.post("/photo", protect, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Photo must be an image (JPG/PNG/WEBP)" });
    }

    let url;
    if (cloudinaryEnabled()) {
      const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(b64, {
        folder: "pt-tutor/photos",
        resource_type: "image",
      });
      url = result.secure_url;
    } else {
      url = `dev://uploaded/${Date.now()}_${req.file.originalname}`;
      console.log(`📷 [DEV MODE] Would upload photo to Cloudinary: ${req.file.originalname}`);
    }

    await User.updateOne(
      { _id: req.user._id },
      { $set: { "mentorProfile.photo": url } }
    );

    res.json({ message: "Photo uploaded", url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;