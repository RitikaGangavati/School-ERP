const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");

const {
  createHouseSchema,
  updateHouseSchema,
  idParamSchema,
} = require("../validators/houseValidator");

const {
  createHouse,
  getAllHouses,
  getHouseById,
  updateHouse,
  deleteHouse,
} = require("../controllers/houseController");

router.use(protect);

router.post(
  "/create",
  authorize("Super Admin", "Admin"),
  validate(createHouseSchema, "body"),
  createHouse,
);

router.get("/list", authorize("Super Admin", "Admin"), getAllHouses);

router.get(
  "/details/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  getHouseById,
);

router.put(
  "/update/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  validate(updateHouseSchema, "body"),
  updateHouse,
);

router.delete(
  "/delete/:id",
  authorize("Super Admin", "Admin"),
  validate(idParamSchema, "params"),
  deleteHouse,
);

module.exports = router;
