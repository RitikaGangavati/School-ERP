const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createSubjectTeacher,
  getAllSubjectTeachers,
  getSubjectTeacherById,
  updateSubjectTeacher,
  deleteSubjectTeacher,
} = require("../controllers/subjectTeacherController");

router.use(protect);

router.post("/create", createSubjectTeacher);
router.get("/list", getAllSubjectTeachers);
router.get("/details/:id", getSubjectTeacherById);
router.put("/update/:id", updateSubjectTeacher);
router.delete("/delete/:id", deleteSubjectTeacher);

module.exports = router;