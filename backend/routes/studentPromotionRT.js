const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getStudentsForPromotion,
  promoteStudents,
  getStudentPromotionHistory,
  getAllPromotions,

} = require("../controllers/studentPromotionController");

router.use(protect);

router.get("/students", authorize("Super Admin", "Admin"), getStudentsForPromotion); 
router.post("/promote", 
authorize("Super Admin", "Admin"), promoteStudents);
router.get("/history/:studentId", authorize("Super Admin", "Admin"), getStudentPromotionHistory);
router.get("/list", authorize("Super Admin", "Admin"), getAllPromotions);

module.exports = router;