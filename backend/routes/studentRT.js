  const express = require("express");
  const router = express.Router();
  const { protect } = require("../middleware/authMiddleware");
  
  const {
   createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  } = require("../controllers/studentController");
  
  router.use(protect);
  
  router.post("/create", createStudent);
  router.get("/list", getAllStudents);
  router.get("/details/:id", getStudentById);
  router.put("/update/:id", updateStudent);
  router.delete("/delete/:id", deleteStudent);
  
  module.exports = router;