const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createHouse,
  getAllHouses,
  getHouseById,
  updateHouse,
  deleteHouse,
} = require("../controllers/houseController");

router.use(protect);

router.post("/create", createHouse);
router.get("/list", getAllHouses);
router.get("/details/:id", getHouseById);
router.put("/update/:id", updateHouse);
router.delete("/delete/:id", deleteHouse);

module.exports = router;