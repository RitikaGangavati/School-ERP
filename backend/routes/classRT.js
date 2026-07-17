const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

router.use(protect);
    
router.post("/create", createClass);
router.get("/list", getAllClasses);
router.get("/details/:id", getClassById);
router.put("/update/:id", updateClass);
router.delete("/delete/:id", deleteClass);

module.exports = router;