const router = require("express").Router();
const { pendingMentors, reviewMentor, stats, allBookings } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.get("/mentors/pending", pendingMentors);
router.patch("/mentors/:id", reviewMentor);
router.get("/stats", stats);
router.get("/bookings", allBookings);

module.exports = router;