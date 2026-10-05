const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  idParamSchema,
} = require("../validators/academicYearValidator");

const {
  createAcademicYear,
  getCurrentAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
} = require("../controllers/academicYearController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createAcademicYearSchema, "body"),
  createAcademicYear
);

router.get("/list", authorize("Super Admin", "Admin"), getAllAcademicYears);
router.get("/current", authorize("Super Admin", "Admin"), getCurrentAcademicYear);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getAcademicYearById
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateAcademicYearSchema, "body"),
  updateAcademicYear
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteAcademicYear
);

module.exports = router;