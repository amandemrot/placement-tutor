const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student",
    },
password: { type: String, select: false },
    googleId: { type: String },
    avatar: { type: String },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    isVerified: { type: Boolean, default: false },

    // Mentor-specific
    mentorProfile: {
      // step 1 — personal
      phone: String,
      location: String,
      bio: String,
      linkedIn: String,
      // step 2 — education
      college: String,
      degree: String,
      branch: String,
      graduationYear: String,
      // step 3 — experience
      company: String,
      designation: String,
      experience: String,
      skills: [String],
      pricePerHour: { type: Number, default: 0 },
      // step 4 — verification
      photo: String,
      verificationDoc: String,
      // meta
      onboardingStep: { type: Number, default: 1 },
      onboardingSubmitted: { type: Boolean, default: false },
      termsAccepted: { type: Boolean, default: false },
      verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      earnings: { type: Number, default: 0 },
    },
    // Student-specific
    profileCompleted: { type: Boolean, default: false },
    studentProfile: {
      about: String,
      fieldOfInterest: String,
      college: String,
      year: String,
      careerGoal: String,
    },
  },
  { timestamps: true }
);

// hash password before save (only if changed)
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// compare a plain password against the hash
userSchema.methods.matchPassword = async function (entered) {
  const bcrypt = require("bcryptjs");
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);