require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admins = await User.find({ role: "admin" }).select("name email createdAt");
  console.log(admins.length ? admins : "No admin accounts found");
  process.exit(0);
});