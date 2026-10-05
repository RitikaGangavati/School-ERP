const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createSubjectGroupSchema,
  updateSubjectGroupSchema,
  idParamSchema,
} = require("../validators/subjectGroupValidator");

const {
  createSubjectGroup,
  getAllSubjectGroups,
  getSubjectGroupById,
  updateSubjectGroup,
  deleteSubjectGroup,
} = require("../controllers/subjectGroupController");

router.use(protect);
router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createSubjectGroupSchema, "body"),
  createSubjectGroup,
);

router.get("/list", authorize("Super Admin", "Admin"), getAllSubjectGroups);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getSubjectGroupById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateSubjectGroupSchema, "body"),
  updateSubjectGroup,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteSubjectGroup,
);

module.exports = router;
