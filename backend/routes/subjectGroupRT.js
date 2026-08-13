const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createSubjectGroup,
  getAllSubjectGroups,
  getSubjectGroupById,
  updateSubjectGroup,
  deleteSubjectGroup,
} = require("../controllers/subjectGroupController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createSubjectGroup);
router.get("/list", authorize("Super Admin", "Admin"), getAllSubjectGroups);
router.get("/details/:id", authorize("Super Admin", "Admin"), getSubjectGroupById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateSubjectGroup);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteSubjectGroup);

module.exports = router;