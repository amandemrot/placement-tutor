const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---- helper: send OTP (email if creds exist, else console) ----
const sendOtp = async (email, otp) => {
  if (!process.env.BREVO_API_KEY) {
    console.log(`🔑 [DEV MODE] OTP for ${email}: ${otp}`);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "PT-Tutor", email: process.env.EMAIL_USER },
      to: [{ email }],
      subject: "Your PT-Tutor Login OTP",
      htmlContent: `<h2>Your OTP: <b>${otp}</b></h2><p>Valid for 10 minutes.</p>`,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo failed: ${res.status} ${err}`);
  }
};

// POST /api/auth/request-otp  { email, name? }
exports.requestOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name: name || email.split("@")[0] });
    }
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtp(email, otp);
    const devMode = !process.env.BREVO_API_KEY;
    res.json({ message: "OTP sent", ...(devMode && { devOtp: otp }) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp  { email, otp }
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
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
// PUT /api/auth/profile  { name, about, fieldOfInterest, collegeYear, careerGoal }
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
    const { name, email, password, role } = req.body;
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
      // OTP-only account exists — attach a password to it
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

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