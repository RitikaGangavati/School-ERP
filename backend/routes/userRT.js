const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.use(protect);
router.post("/create",createUser);
router.get("/list",  getAllUsers);
router.get("/details/:id", getUserById);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

module.exports = router;