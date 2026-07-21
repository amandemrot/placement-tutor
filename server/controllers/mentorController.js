const User = require("../models/User");
const Slot = require("../models/Slot");

// POST /api/mentors/become  (any logged-in user applies as mentor)
exports.becomeMentor = async (req, res) => {
  try {
    const { college, company, designation, bio, skills, pricePerHour } = req.body;
    const user = await User.findById(req.user._id);
    user.role = "mentor";
    user.mentorProfile = {
      ...user.mentorProfile,
      college, company, designation, bio,
      skills: skills || [],
      pricePerHour: pricePerHour || 0,
      verificationStatus: "pending",
    };
    await user.save();
    res.json({ message: "Mentor application submitted", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/mentors  (public list of approved mentors)
exports.listMentors = async (req, res) => {
  try {
    const mentors = await User.find({
      role: "mentor",
      "mentorProfile.verificationStatus": "approved",
}).select("-password -otp -otpExpires -googleId -mentorProfile.phone -mentorProfile.verificationDoc -mentorProfile.earnings");
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// POST /api/mentors/availability
// { date:"2026-07-20", startTime:"10:00", endTime:"12:00", durationMinutes:30 }
// Splits window into atomic slots
exports.addAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime, durationMinutes } = req.body;
    if (![15, 30, 60].includes(durationMinutes)) {
      return res.status(400).json({ message: "Duration must be 15, 30 or 60" });
    }

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "Invalid time window" });
    }
    if (start < new Date()) {
      return res.status(400).json({ message: "Cannot add availability in the past" });
    }

    const pricePerHour = req.user.mentorProfile?.pricePerHour || 0;
    const price = Math.round((pricePerHour * durationMinutes) / 60);

    const slots = [];
    let cursor = new Date(start);
    while (cursor.getTime() + durationMinutes * 60000 <= end.getTime()) {
      slots.push({
        mentor: req.user._id,
        date,
        startTime: new Date(cursor),
        endTime: new Date(cursor.getTime() + durationMinutes * 60000),
        durationMinutes,
        price,
      });
      cursor = new Date(cursor.getTime() + durationMinutes * 60000);
    }
    if (!slots.length) return res.status(400).json({ message: "Window too small for duration" });

    // ordered:false → duplicates (unique index) are skipped, rest inserted
    const result = await Slot.insertMany(slots, { ordered: false }).catch((e) => e.insertedDocs || []);
    res.json({ message: `${result.length} slots created`, slots: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/mentors/:id
exports.getMentor = async (req, res) => {
  try {
    const mentor = await User.findOne({
      _id: req.params.id,
      role: "mentor",
      "mentorProfile.verificationStatus": "approved",
    }).select("-password -otp -otpExpires -googleId -mentorProfile.verificationDoc -mentorProfile.earnings");
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });

    const obj = mentor.toObject();
    const phone = obj.mentorProfile?.phone || "";
    const email = obj.email || "";
    // send masked hints only, strip the real values
    obj.contactHints = {
      phone: phone ? `${phone.slice(0, 4)} - ${"*".repeat(Math.max(phone.length - 6, 2))} - ${phone.slice(-2)}` : null,
      email: email ? `${email.slice(0, 6)}*****${email.slice(email.indexOf("@"))}` : null,
    };
    if (obj.mentorProfile) delete obj.mentorProfile.phone;
    delete obj.email;

    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET /api/mentors/:id/slots?date=2026-07-20  (public: available only)
exports.getMentorSlots = async (req, res) => {
  try {
    const filter = {
      mentor: req.params.id,
      status: "available",
      startTime: { $gt: new Date() },
    };
    if (req.query.date) filter.date = req.query.date;
    const slots = await Slot.find(filter).sort("startTime");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET /api/mentors/my/slots  (mentor's own, all statuses)
exports.getMySlots = async (req, res) => {
  try {
    const slots = await Slot.find({ mentor: req.user._id }).sort("startTime");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/mentors/slots/:slotId (only if still available)
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findOneAndDelete({
      _id: req.params.slotId,
      mentor: req.user._id,
      status: "available",
    });
    if (!slot) return res.status(400).json({ message: "Slot not found or already booked/locked" });
    res.json({ message: "Slot deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// PUT /api/mentors/onboarding  { step, data, submit? }
exports.saveOnboarding = async (req, res) => {
  try {
    const { step, data, submit, name } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
if (name && name.trim()) user.name = name.trim();
    user.role = "mentor";
    user.mentorProfile = { ...(user.mentorProfile?.toObject?.() || user.mentorProfile || {}), ...data };

    if (step) user.mentorProfile.onboardingStep = step;
    if (submit) {
      user.mentorProfile.onboardingSubmitted = true;
      user.mentorProfile.verificationStatus = "pending";
    }
    await user.save();

    res.json({
      message: submit ? "Submitted for approval" : "Progress saved",
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar, mentorProfile: user.mentorProfile,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/mentors/onboarding  (load saved progress)
exports.getOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ mentorProfile: user.mentorProfile || {}, name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};