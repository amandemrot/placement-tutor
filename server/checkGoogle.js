require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const u = await User.findOne({ email: "amandemrot456@gmail.com" }).lean();
  if (!u) { console.log("❌ No user with that email"); process.exit(0); }
  console.log("email:", u.email);
  console.log("name:", u.name);
  console.log("role:", u.role);
  console.log("profileCompleted:", u.profileCompleted);
  console.log("googleId:", u.googleId);
  console.log("createdAt:", u.createdAt);
  process.exit(0);
})();