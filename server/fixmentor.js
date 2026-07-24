require("dotenv").config();
const m = require("mongoose");
const U = require("./models/User");

const OLD = "arjun.mehta@placementtutor.demo";
const NEW = "amandemrot5@gmail.com";

m.connect(process.env.MONGO_URI).then(async () => {
  const clash = await U.findOne({ email: NEW });
  if (clash) {
    console.log("ALREADY TAKEN by:", clash.name, "| role:", clash.role);
    process.exit(0);
  }
  const r = await U.updateOne({ email: OLD }, { $set: { email: NEW } });
  console.log("matched", r.matchedCount, "modified", r.modifiedCount);
  const u = await U.findOne({ email: NEW });
  console.log("NOW:", u && u.name, "|", u && u.email);
  process.exit(0);
});