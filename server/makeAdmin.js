require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const email = process.argv[2];
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const r = await User.updateOne({ email }, { $set: { role: "admin" } });
  console.log(r.modifiedCount ? `✅ ${email} is now ADMIN` : `❌ ${email} not found`);
  process.exit(0);
});