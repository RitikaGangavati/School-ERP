const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} = require("../validators/userValidator");

const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  restoreUser,
  permanentDeleteUser,
  getDeletedUsers,
} = require("../controllers/userController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createUserSchema, "body"),
  createUser,
);

router.get("/list", authorize("Super Admin", "Admin"), getAllUsers);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getUserById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateUserSchema, "body"),
  updateUser,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  softDeleteUser,
);
router.patch(
  "/restore/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  restoreUser,
);
router.delete(
  "/permanent-delete/:id",
  authorize("Super Admin"),
  validate(idParamSchema, "params"),
  permanentDeleteUser,
);
router.get(
  "/deleted-list", 
  authorize("Super Admin"), 
  getDeletedUsers);

module.exports = router;
