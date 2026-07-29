const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");


router.use(protect);

router.post("/create", createTeacher);
router.get("/list", getAllTeachers);
router.get("/details/:id", getTeacherById);
router.put("/update/:id", updateTeacher);
router.delete("/delete/:id", deleteTeacher);

module.exports = router;
