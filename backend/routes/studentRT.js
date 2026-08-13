  const express = require("express");
  const router = express.Router();
  const { protect } = require("../middleware/authMiddleware");
  const { authorize } = require("../middleware/roleMiddleware");
  
  const {
   createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  } = require("../controllers/studentController");
  
  router.use(protect);
  
  router.post("/create", authorize("Super Admin", "Admin"), createStudent);
  router.get("/list", authorize("Super Admin", "Admin"), getAllStudents);
  router.get("/details/:id", authorize("Super Admin", "Admin"), getStudentById);
  router.put("/update/:id", authorize("Super Admin", "Admin"), updateStudent);
  router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteStudent);
  
  module.exports = router;