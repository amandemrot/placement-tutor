const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");
const { sendOtpMail, isDemo } = require("../utils/mailer");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---- helper: send OTP (demo accounts skip email; everyone else gets a real one) ----
const sendOtp = async (email, otp) => {
  if (isDemo(email) || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`🔑 [DEV MODE] OTP for ${email}: ${otp}`);
    return { emailed: false };
  }
  try {
    await sendOtpMail(email, otp);
    return { emailed: true };
  } catch (err) {
    console.error("Mail failed:", err.message);
    console.log(`🔑 [FALLBACK] OTP for ${email}: ${otp}`);
    return { emailed: false };
  }
};

// POST /api/auth/request-otp  { email, name?, isSignup? }
exports.requestOtp = async (req, res) => {
  try {
    let { email, name, isSignup } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    email = email.trim().toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let user = await User.findOne({ email });
    if (!user) {
      if (!isSignup) {
        return res.status(404).json({ message: "No account found with this email. Please create an account first." });
      }
      user = await User.create({ email, name: name || email.split("@")[0] });
    }
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const { emailed } = await sendOtp(email, otp);
    res.json({
      message: emailed ? "OTP sent to your email" : "OTP generated",
      ...(!emailed && { devOtp: otp }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp  { email, otp }
exports.verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email?.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+otp +otpExpires");
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.json({
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, profileCompleted: user.profileCompleted, studentProfile: user.studentProfile, mentorProfile: user.mentorProfile },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/google  { credential }
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture, sub } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, avatar: picture, googleId: sub, isVerified: true });
    } else if (!user.googleId) {
      user.googleId = sub;
      user.avatar = user.avatar || picture;
      await user.save();
    }

    res.json({
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, profileCompleted: user.profileCompleted, studentProfile: user.studentProfile, mentorProfile: user.mentorProfile },
    });
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed" });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, about, fieldOfInterest, college, year, careerGoal } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    user.studentProfile = {
      about: about || "",
      fieldOfInterest: fieldOfInterest || "",
      college: college || "",
      year: year || "",
      careerGoal: careerGoal || "",
    };
    user.profileCompleted = true;
    await user.save();

    res.json({
      message: "Profile saved",
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar, profileCompleted: user.profileCompleted,
        studentProfile: user.studentProfile, mentorProfile: user.mentorProfile,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/register  { name, email, password, role? }
exports.register = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    email = email?.trim().toLowerCase();
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email }).select("+password");
    if (existing && existing.password) {
      return res.status(400).json({ message: "Account already exists. Please sign in." });
    }

    let user;
    if (existing) {
      existing.password = password;
      existing.name = existing.name || name;
      if (role === "mentor") existing.role = "mentor";
      user = await existing.save();
    } else {
      user = await User.create({
        name, email, password,
        role: role === "mentor" ? "mentor" : "student",
        isVerified: true,
      });
    }

    res.status(201).json({
      token: generateToken(user._id, user.role),
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar, profileCompleted: user.profileCompleted,
        studentProfile: user.studentProfile, mentorProfile: user.mentorProfile,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login  { email, password }
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user._id, user.role),
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar, profileCompleted: user.profileCompleted,
        studentProfile: user.studentProfile, mentorProfile: user.mentorProfile,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};