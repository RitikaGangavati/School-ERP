const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
   createClassTeacher,
  getAllClassTeachers,
  getClassTeacherById,
  updateClassTeacher,
  deleteClassTeacher,
} = require("../controllers/classTeacherController");

router.use(protect);
    
router.post("/create", createClassTeacher);
router.get("/list", getAllClassTeachers);
router.get("/details/:id", getClassTeacherById);
router.put("/update/:id", updateClassTeacher);
router.delete("/delete/:id", deleteClassTeacher);

module.exports = router;