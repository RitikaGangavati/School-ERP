const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createSubjectTeacher,
  getAllSubjectTeachers,
  getSubjectTeacherById,
  updateSubjectTeacher,
  deleteSubjectTeacher,
} = require("../controllers/subjectTeacherController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createSubjectTeacher);
router.get("/list", authorize("Super Admin", "Admin"), getAllSubjectTeachers);
router.get("/details/:id", authorize("Super Admin", "Admin"), getSubjectTeacherById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateSubjectTeacher);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteSubjectTeacher);

module.exports = router;