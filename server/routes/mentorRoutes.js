const router = require("express").Router();
const {
  becomeMentor, listMentors, getMentor,
  addAvailability, getMentorSlots, getMySlots, deleteSlot,
  saveOnboarding, getOnboarding,
} = require("../controllers/mentorController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", listMentors);
router.post("/become", protect, becomeMentor);
router.put("/onboarding", protect, saveOnboarding);
router.get("/onboarding", protect, getOnboarding);
router.post("/availability", protect, authorize("mentor"), addAvailability);
router.get("/my/slots", protect, authorize("mentor"), getMySlots);
router.delete("/slots/:slotId", protect, authorize("mentor"), deleteSlot);
router.get("/:id/slots", getMentorSlots);
router.get("/:id", getMentor);

module.exports = router;