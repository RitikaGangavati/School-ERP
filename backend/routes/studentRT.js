const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createStudentSchema,
  updateStudentSchema,
  idParamSchema,
  studentListQuerySchema
} = require("../validators/studentValidator");

const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createStudentSchema, "body"),
  createStudent,
);

router.get(
  "/list",
  authorize("Super Admin", "Admin"),
  validate(studentListQuerySchema, "query"),
  getAllStudents
);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getStudentById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateStudentSchema, "body"),
  updateStudent,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteStudent,
);

module.exports = router;
