const router = require("express").Router();
const { requestOtp, verifyOtp, googleLogin, getMe, updateProfile, register, login } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/google", googleLogin);
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;