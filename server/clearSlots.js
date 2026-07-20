require("dotenv").config();
const mongoose = require("mongoose");
const Slot = require("./models/Slot");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const r = await Slot.deleteMany({ price: 0 });
  console.log(`🗑️ Deleted ${r.deletedCount} slot(s) priced at ₹0`);
  process.exit(0);
})();