const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // "2026-07-20"
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, enum: [15, 30, 60], required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lockExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One mentor can't have two slots at the same start time
slotSchema.index({ mentor: 1, startTime: 1 }, { unique: true });
// Fast queries for availability
slotSchema.index({ mentor: 1, date: 1, status: 1 });

module.exports = mongoose.model("Slot", slotSchema);