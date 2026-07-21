require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // 1. any stray admin-ish accounts (typos / auto-created)?
  const strays = await User.find({
    $or: [{ email: /admin/i }, { name: /^admin$/i }],
  }).select("email name role profileCompleted createdAt");
  console.log("--- Accounts matching 'admin' ---");
  strays.forEach(u =>
    console.log(`${u.email} | role: ${u.role} | name: ${u.name} | created: ${u.createdAt?.toISOString?.()}`)
  );

  // 2. direct password test on the real admin
  const admin = await User.findOne({ email: "admin@pttutor.com" }).select("+password");
  const ok = await bcrypt.compare("admin123", admin.password);
  console.log("--- Password test ---");
  console.log("bcrypt.compare('admin123', storedHash):", ok);

  await mongoose.disconnect();
})();