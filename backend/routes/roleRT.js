const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

router.use(protect);

router.post("/create", createRole);
router.get("/list", getAllRoles);
router.get("/details/:id", getRoleById);
router.put("/update/:id", updateRole);
router.delete("/delete/:id", deleteRole);

module.exports = router;