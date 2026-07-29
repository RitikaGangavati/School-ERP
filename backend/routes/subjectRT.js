const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

router.use(protect);

router.post("/create", createSubject);
router.get("/list", getAllSubjects);
router.get("/details/:id", getSubjectById);
router.put("/update/:id", updateSubject);
router.delete("/delete/:id", deleteSubject);

module.exports = router;