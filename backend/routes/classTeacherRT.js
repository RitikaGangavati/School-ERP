const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
   createClassTeacher,
  getAllClassTeachers,
  getClassTeacherById,
  updateClassTeacher,
  deleteClassTeacher,
} = require("../controllers/classTeacherController");

router.use(protect);
    
router.post("/create", authorize("Super Admin", "Admin"), createClassTeacher);
router.get("/list", authorize("Super Admin", "Admin"), getAllClassTeachers);
router.get("/details/:id", authorize("Super Admin", "Admin"), getClassTeacherById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateClassTeacher);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteClassTeacher);

module.exports = router;