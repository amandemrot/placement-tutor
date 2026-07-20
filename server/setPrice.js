require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const [, , email, price] = process.argv;

(async () => {
  if (!email || !price) {
    console.log("Usage: node setPrice.js <mentorEmail> <pricePerHour>");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const u = await User.findOne({ email });
  if (!u) { console.log("❌ user not found:", email); process.exit(1); }
  u.mentorProfile.pricePerHour = Number(price);
  await u.save();
  console.log(`✅ ${email} pricePerHour set to ₹${price}/hr`);
  process.exit(0);
})();