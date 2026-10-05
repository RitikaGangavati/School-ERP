const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createClassTeacherSchema,
  updateClassTeacherSchema,
  idParamSchema,
} = require("../validators/classTeacherValidator");

const {
  createClassTeacher,
  getAllClassTeachers,
  getClassTeacherById,
  updateClassTeacher,
  deleteClassTeacher,
} = require("../controllers/classTeacherController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createClassTeacherSchema, "body"),
  createClassTeacher,
);

router.get("/list", authorize("Super Admin", "Admin"), getAllClassTeachers);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getClassTeacherById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateClassTeacherSchema, "body"),
  updateClassTeacher,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteClassTeacher,
);

module.exports = router;
