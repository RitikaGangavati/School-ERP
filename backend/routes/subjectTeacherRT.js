const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createSubjectTeacherSchema,
  updateSubjectTeacherSchema,
  idParamSchema,
} = require("../validators/subjectTeacherValidator");

const {
  createSubjectTeacher,
  getAllSubjectTeachers,
  getSubjectTeacherById,
  updateSubjectTeacher,
  deleteSubjectTeacher,
} = require("../controllers/subjectTeacherController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createSubjectTeacherSchema, "body"),
  createSubjectTeacher,
);

router.get("/list", authorize("Super Admin", "Admin"), getAllSubjectTeachers);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getSubjectTeacherById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateSubjectTeacherSchema, "body"),
  updateSubjectTeacher,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteSubjectTeacher,
);

module.exports = router;
