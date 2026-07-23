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
    const [students, mentors, bookings, revenue, pending, cancelled, slotsOpen] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "mentor" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.countDocuments({ role: "mentor", "mentorProfile.verificationStatus": "pending" }),
      Booking.countDocuments({ status: "cancelled" }),
      Slot.countDocuments({ status: "available" }),
    ]);
    res.json({
      students, mentors, bookings, pending, cancelled, slotsOpen,
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
// GET /api/admin/mentors  (all mentors with slot + earning counts)
exports.allMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: "mentor" })
      .select("name email avatar mentorProfile createdAt")
      .sort("-createdAt");

    const withCounts = await Promise.all(
      mentors.map(async (m) => {
        const [slotsCreated, slotsBooked, sessions] = await Promise.all([
          Slot.countDocuments({ mentor: m._id }),
          Slot.countDocuments({ mentor: m._id, status: "booked" }),
          Booking.countDocuments({ mentor: m._id, status: { $in: ["confirmed", "completed"] } }),
        ]);
        return {
          _id: m._id,
          name: m.name,
          email: m.email,
          createdAt: m.createdAt,
          photo: m.mentorProfile?.photo,
          company: m.mentorProfile?.company,
          designation: m.mentorProfile?.designation,
          pricePerHour: m.mentorProfile?.pricePerHour || 0,
          earnings: m.mentorProfile?.earnings || 0,
          status: m.mentorProfile?.verificationStatus || "pending",
          slotsCreated,
          slotsBooked,
          sessions,
        };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/students
exports.allStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email avatar studentProfile profileCompleted createdAt")
      .sort("-createdAt");

    const withCounts = await Promise.all(
      students.map(async (s) => {
        const [booked, cancelled, spentAgg] = await Promise.all([
          Booking.countDocuments({ student: s._id, status: { $in: ["confirmed", "completed"] } }),
          Booking.countDocuments({ student: s._id, status: "cancelled" }),
          Booking.aggregate([
            { $match: { student: s._id, status: { $in: ["confirmed", "completed"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]);
        return {
          _id: s._id,
          name: s.name,
          email: s.email,
          createdAt: s.createdAt,
          profileCompleted: s.profileCompleted,
          college: s.studentProfile?.college,
          year: s.studentProfile?.year,
          fieldOfInterest: s.studentProfile?.fieldOfInterest,
          sessions: booked,
          cancelled,
          spent: spentAgg[0]?.total || 0,
        };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET /api/admin/mentors/:id  (full profile + live slots)
exports.mentorDetail = async (req, res) => {
  try {
    const m = await User.findOne({ _id: req.params.id, role: "mentor" })
      .select("name email avatar mentorProfile createdAt");
    if (!m) return res.status(404).json({ message: "Mentor not found" });

    const [slots, sessions, cancelled] = await Promise.all([
      Slot.find({ mentor: m._id }).sort("startTime").limit(100),
      Booking.countDocuments({ mentor: m._id, status: { $in: ["confirmed", "completed"] } }),
      Booking.countDocuments({ mentor: m._id, status: "cancelled" }),
    ]);

    res.json({ mentor: m, slots, sessions, cancelled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET /api/admin/students/:id  (full profile + booking history)
exports.studentDetail = async (req, res) => {
  try {
    const s = await User.findOne({ _id: req.params.id, role: "student" })
      .select("name email avatar studentProfile profileCompleted isVerified createdAt");
    if (!s) return res.status(404).json({ message: "Student not found" });

    const bookings = await Booking.find({ student: s._id })
      .populate("mentor", "name email mentorProfile.company mentorProfile.photo")
      .populate("slot", "date startTime endTime durationMinutes")
      .sort("-createdAt")
      .limit(100);

    const counts = {
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      pendingPayment: bookings.filter((b) => b.status === "pending_payment").length,
    };
    counts.spent = bookings
      .filter((b) => ["confirmed", "completed"].includes(b.status))
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    // sessions whose slot time has passed but were never completed
    counts.missed = bookings.filter(
      (b) => b.status === "confirmed" && b.slot?.endTime && new Date(b.slot.endTime) < new Date()
    ).length;

    res.json({ student: s, bookings, counts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};