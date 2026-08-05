const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getStudentsForPromotion,
  promoteStudents,
  getStudentPromotionHistory,
  getAllPromotions,

} = require("../controllers/studentPromotionController");

router.use(protect);

router.get("/students", getStudentsForPromotion); 
router.post("/promote", promoteStudents);
router.get("/history/:studentId", getStudentPromotionHistory);
router.get("/list", getAllPromotions);

module.exports = router;