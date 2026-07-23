const router = require("express").Router();
const { pendingMentors, reviewMentor, stats, allBookings, allMentors, allStudents, mentorDetail, studentDetail } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.get("/mentors/pending", pendingMentors);
router.patch("/mentors/:id", reviewMentor);
router.get("/stats", stats);
router.get("/bookings", allBookings);
router.get("/mentors", allMentors);
router.get("/students", allStudents);
router.get("/mentors/:id", mentorDetail);
router.get("/students/:id", studentDetail);

module.exports = router;