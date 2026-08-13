const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createCategory);
router.get("/list", authorize("Super Admin", "Admin"), getAllCategories);
router.get("/details/:id", authorize("Super Admin", "Admin"), getCategoryById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateCategory);
router.delete("/delete/:id",authorize("Super Admin", "Admin"),  deleteCategory);

module.exports = router;