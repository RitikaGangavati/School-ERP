const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createRole);
router.get("/list", authorize("Super Admin", "Admin"), getAllRoles);
router.get("/details/:id", authorize("Super Admin", "Admin"), getRoleById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateRole);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteRole);

module.exports = router;