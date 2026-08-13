const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createHouse,
  getAllHouses,
  getHouseById,
  updateHouse,
  deleteHouse,
} = require("../controllers/houseController");

router.use(protect);

router.post("/create", authorize("Super Admin", "Admin"), createHouse);
router.get("/list", authorize("Super Admin", "Admin"), getAllHouses);
router.get("/details/:id", authorize("Super Admin", "Admin"), getHouseById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateHouse);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteHouse);

module.exports = router;