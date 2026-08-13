const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");


router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createTeacher);
router.get("/list", authorize("Super Admin", "Admin"), getAllTeachers);
router.get("/details/:id", authorize("Super Admin", "Admin"), getTeacherById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateTeacher);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteTeacher);

module.exports = router;
