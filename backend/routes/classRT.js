const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

router.use(protect);
    
router.post("/create", authorize("Super Admin", "Admin"), createClass);
router.get("/list", authorize("Super Admin", "Admin"), getAllClasses);
router.get("/details/:id", authorize("Super Admin", "Admin"), getClassById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateClass);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteClass);

module.exports = router;