require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const r = await User.deleteOne({ email: "admin@pttutor.com ", role: "student" });
  console.log("Deleted ghost accounts:", r.deletedCount);
  await mongoose.disconnect();
})();