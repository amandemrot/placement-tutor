const mongoose = require("mongoose");
const Slot = require("../models/Slot");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendBookingConfirmation, sendMentorNotification, isDemo } = require("../utils/mailer");

const LOCK_MINUTES = 7;
const paymentsEnabled = () =>
  !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// POST /api/bookings/lock  { slotId }
// ATOMIC: only succeeds if slot is truly available (or its lock expired)
exports.lockSlot = async (req, res) => {
  try {
    const { slotId } = req.body;
    const now = new Date();

    // Enforce max 3 confirmed bookings per student (before locking/paying)
    const myConfirmed = await Booking.find({ student: req.user._id, status: "confirmed" }).populate("slot", "startTime");
    const bookingCount = myConfirmed.filter(b => b.slot && new Date(b.slot.startTime) > now).length;
    if (bookingCount >= 3) {
      return res.status(403).json({ message: "You've reached the maximum of 3 bookings." });
    }

    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        startTime: { $gt: now },
        $or: [
          { status: "available" },
          { status: "locked", lockExpiresAt: { $lt: now } }, // expired lock steal
        ],
      },
      {
        $set: {
          status: "locked",
          lockedBy: req.user._id,
          lockExpiresAt: new Date(now.getTime() + LOCK_MINUTES * 60000),
        },
      },
      { new: true }
    );

    if (!slot) {
      return res.status(409).json({ message: "Slot is no longer available" });
    }

    // Create razorpay order if keys exist, else dev-mode order
    let order = null;
    if (paymentsEnabled()) {
      order = await getRazorpay().orders.create({
        amount: slot.price * 100, // paise
        currency: "INR",
        receipt: `slot_${slot._id}`,
      });
    } else {
      order = { id: `dev_order_${slot._id}`, amount: slot.price * 100, currency: "INR", devMode: true };
    }

    res.json({
      message: `Slot locked for ${LOCK_MINUTES} minutes`,
      slot,
      order,
      keyId: process.env.RAZORPAY_KEY_ID || null,
    });
  } catch (err) {
    console.error("❌ LOCK ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bookings/confirm
// { slotId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
exports.confirmBooking = async (req, res) => {
  try {
    const { slotId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const now = new Date();

    // Enforce max 3 confirmed bookings per student
    const myConfirmed = await Booking.find({ student: req.user._id, status: "confirmed" }).populate("slot", "startTime");
    const bookingCount = myConfirmed.filter(b => b.slot && new Date(b.slot.startTime) > now).length;
    if (bookingCount >= 3) {
      // release the lock so the slot goes back to available
      await Slot.updateOne(
        { _id: slotId, status: "locked", lockedBy: req.user._id },
        { $set: { status: "available", lockedBy: null, lockExpiresAt: null } }
      );
      return res.status(403).json({ message: "You've reached the maximum of 3 bookings." });
    }

    // Verify payment signature (skipped in dev mode)
    if (paymentsEnabled()) {
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");
      if (expected !== razorpaySignature) {
        return res.status(400).json({ message: "Payment verification failed" });
      }
    }

    // ATOMIC: only the locker can convert lock → booked, and only before expiry
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        status: "locked",
        lockedBy: req.user._id,
        lockExpiresAt: { $gt: now },
      },
      { $set: { status: "booked", lockedBy: null, lockExpiresAt: null } },
      { new: true }
    );
    if (!slot) {
      return res.status(409).json({ message: "Lock expired or slot not locked by you" });
    }

    const booking = await Booking.create({
      student: req.user._id,
      mentor: slot.mentor,
      slot: slot._id,
      amount: slot.price,
      status: "confirmed",
      razorpayOrderId: razorpayOrderId || "dev",
      razorpayPaymentId: razorpayPaymentId || "dev",
      meetingLink: `https://meet.jit.si/pt-tutor-${slot._id}`,
    });

    // credit mentor earnings
  // credit mentor earnings
    await User.updateOne(
      { _id: slot.mentor },
      { $inc: { "mentorProfile.earnings": slot.price } }
    );

    // confirmation emails (never block the response)
    (async () => {
      try {
        const [student, mentor] = await Promise.all([
          User.findById(req.user._id).select("name email"),
          User.findById(slot.mentor).select("name email mentorProfile.company"),
        ]);
        const time = new Date(slot.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        const common = {
          date: slot.date,
          time,
          duration: slot.durationMinutes,
          amount: slot.price,
          meetingLink: booking.meetingLink,
        };

        if (student?.email && !isDemo(student.email)) {
          await sendBookingConfirmation({
            ...common,
            to: student.email,
            studentName: student.name,
            mentorName: mentor?.name || "your mentor",
            company: mentor?.mentorProfile?.company,
          });
        }
        if (mentor?.email && !isDemo(mentor.email)) {
          await sendMentorNotification({
            ...common,
            to: mentor.email,
            mentorName: mentor.name,
            studentName: student?.name || "A student",
          });
        }
      } catch (e) {
        console.error("Booking mail failed:", e.message);
      }
    })();

    res.json({ message: "Booking confirmed 🎉", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bookings/release  { slotId }  (user cancels checkout)
exports.releaseSlot = async (req, res) => {
  try {
    await Slot.updateOne(
      { _id: req.body.slotId, status: "locked", lockedBy: req.user._id },
      { $set: { status: "available", lockedBy: null, lockExpiresAt: null } }
    );
    res.json({ message: "Slot released" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my  (student's bookings)
exports.myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate("mentor", "name avatar mentorProfile.company mentorProfile.photo")
      .populate("slot", "date startTime endTime durationMinutes")
      .sort("-createdAt");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/mentor  (mentor's sessions)
exports.mentorBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ mentor: req.user._id })
      .populate("student", "name avatar email")
      .populate("slot", "date startTime endTime durationMinutes")
      .sort("-createdAt");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// POST /api/bookings/cancel  { bookingId }
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      student: req.user._id,
      status: "confirmed",
    }).populate("slot");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or already cancelled" });
    }
    if (!booking.slot) {
      return res.status(400).json({ message: "This booking has no valid slot" });
    }

    // 10-minute rule: can't cancel within 10 min of start
    const start = new Date(booking.slot.startTime).getTime();
    const cutoff = start - 10 * 60000;
    if (Date.now() >= cutoff) {
      return res.status(403).json({ message: "Cancellation window has closed (within 10 minutes of start)" });
    }

    // mark cancelled
    booking.status = "cancelled";
    await booking.save();

    // return slot to available
    await Slot.updateOne(
      { _id: booking.slot._id },
      { $set: { status: "available", lockedBy: null, lockExpiresAt: null } }
    );

    // reverse mentor earnings
    await User.updateOne(
      { _id: booking.mentor },
      { $inc: { "mentorProfile.earnings": -booking.amount } }
    );

    res.json({ message: "Booking cancelled", bookingId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};