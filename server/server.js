const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Middleware to connect DB on serverless execution
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/mentors", require("./routes/mentorRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.get("/api/health", (req, res) => res.json({ ok: true, status: "live" }));

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  });
}

module.exports = app;