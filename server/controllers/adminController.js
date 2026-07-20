const User = require("../models/User");
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");

// GET /api/admin/mentors/pending
exports.pendingMentors = async (req, res) => {
  try {
    const mentors = await User.find({
      role: "mentor",
      "mentorProfile.verificationStatus": "pending",
    }).select("name email avatar mentorProfile createdAt");
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/mentors/:id  { action: "approve" | "reject" }
exports.reviewMentor = async (req, res) => {
  try {
    const { action } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Action must be approve or reject" });
    }
    const mentor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "mentor" },
      { $set: { "mentorProfile.verificationStatus": action === "approve" ? "approved" : "rejected" } },
      { new: true }
    ).select("name email mentorProfile.verificationStatus");
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });
    res.json({ message: `Mentor ${action}d`, mentor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/stats
exports.stats = async (req, res) => {
  try {
    const [students, mentors, bookings, revenue] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "mentor" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
    res.json({
      students, mentors, bookings,
      revenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/bookings (all, latest first)
exports.allBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("student", "name email")
      .populate("mentor", "name email")
      .populate("slot", "date startTime durationMinutes")
      .sort("-createdAt")
      .limit(100);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};