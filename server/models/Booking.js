const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "completed", "cancelled"],
      default: "pending_payment",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    meetingLink: String,
  },
  { timestamps: true }
);
bookingSchema.index(
  { slot: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } }
);
module.exports = mongoose.model("Booking", bookingSchema);