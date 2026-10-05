const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  getStudentsForPromotionSchema,
  promoteStudentsSchema,
  studentIdParamSchema,
} = require("../validators/studentPromotionValidator");

const {
  getStudentsForPromotion,
  promoteStudents,
  getStudentPromotionHistory,
  getAllPromotions,
} = require("../controllers/studentPromotionController");

router.use(protect);

router.get(
  "/students",
  authorize("Super Admin", "Admin"),
  validate(getStudentsForPromotionSchema, "query"),
  getStudentsForPromotion
);

router.post(
  "/promote",
  authorize("Super Admin", "Admin"),
  validate(promoteStudentsSchema, "body"),
  promoteStudents
);

router.get(
  "/history/:studentId",
  authorize("Super Admin", "Admin"),
  validate(studentIdParamSchema, "params"),
  getStudentPromotionHistory
);

router.get("/list", authorize("Super Admin", "Admin"), getAllPromotions);

module.exports = router;