const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createAcademicYear,
  getCurrentAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
} = require("../controllers/academicYearController");

router.use(protect);

router.post("/create", createAcademicYear);
router.get("/list", getAllAcademicYears);
router.get("/current", getCurrentAcademicYear);
router.get("/details/:id", getAcademicYearById);
router.put("/update/:id", updateAcademicYear);
router.delete("/delete/:id", deleteAcademicYear);

module.exports = router;