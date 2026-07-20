require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("./models/Booking");
const Slot = require("./models/Slot");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const bookings = await Booking.find();
  let removed = 0;
  for (const b of bookings) {
    const slot = await Slot.findById(b.slot);
    if (!slot) {
      await Booking.deleteOne({ _id: b._id });
      removed++;
    }
  }
  console.log(`🗑️ Deleted ${removed} orphaned booking(s) with no slot`);
  process.exit(0);
})();