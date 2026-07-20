const router = require("express").Router();
const {
  lockSlot, confirmBooking, releaseSlot, myBookings, mentorBookings, cancelBooking,
} = require("../controllers/bookingController");
const { protect, authorize } = require("../middleware/auth");

router.post("/lock", protect, lockSlot);
router.post("/confirm", protect, confirmBooking);
router.post("/cancel", protect, cancelBooking);
router.post("/release", protect, releaseSlot);
router.get("/my", protect, myBookings);
router.get("/mentor", protect, authorize("mentor"), mentorBookings);

module.exports = router;