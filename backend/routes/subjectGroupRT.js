const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createSubjectGroup,
  getAllSubjectGroups,
  getSubjectGroupById,
  updateSubjectGroup,
  deleteSubjectGroup,
} = require("../controllers/subjectGroupController");

router.use(protect);

router.post("/create", createSubjectGroup);
router.get("/list", getAllSubjectGroups);
router.get("/details/:id", getSubjectGroupById);
router.put("/update/:id", updateSubjectGroup);
router.delete("/delete/:id", deleteSubjectGroup);

module.exports = router;