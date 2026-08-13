const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createSubject);
router.get("/list", authorize("Super Admin", "Admin"), getAllSubjects);
router.get("/details/:id", authorize("Super Admin", "Admin"), getSubjectById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateSubject);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteSubject);

module.exports = router;