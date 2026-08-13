const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createUser);
router.get("/list", authorize("Super Admin", "Admin"), getAllUsers);
router.get("/details/:id", authorize("Super Admin", "Admin"), getUserById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateUser);
router.delete("/delete/:id", authorize("Super Admin"), deleteUser);

module.exports = router;