const House = require("../models/houseModel");
const Student = require("../models/studentModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Create House
const createHouse = asyncHandler(async (req, res) => {
  const { houseName, description, active } = req.body;

  await checkDuplicate(House, { houseName }, "House already exists");

  const house = await House.create({ houseName, description, active });

  return sendResponse(res, 201, "House created successfully", { house });
});

// Get All Houses
const getAllHouses = asyncHandler(async (req, res) => {
  const { search, active } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["houseName", "description"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: houses, pagination: paginationInfo } = await paginateQuery(
    House,
    filter,
    pagination,
    { sort: { houseName: 1 } }
  );

  return sendResponse(res, 200, "Houses fetched successfully", { houses, pagination: paginationInfo });
});

// Get Single House
const getHouseById = asyncHandler(async (req, res) => {
  const house = await House.findById(req.params.id);

  if (!house) {
    throw new ApiError(404, "House not found");
  }

  return sendResponse(res, 200, "House fetched successfully", { house });
});

// Update House
const updateHouse = asyncHandler(async (req, res) => {
  const { houseName, description, active } = req.body;

  const house = await House.findById(req.params.id);
  if (!house) {
    throw new ApiError(404, "House not found");
  }

  if (houseName && houseName !== house.houseName) {
    await checkDuplicate(House, { houseName }, "House name already exists", house._id);
    house.houseName = houseName;
  }

  if (description !== undefined) house.description = description;
  if (active !== undefined) house.active = active;

  await house.save();

  return sendResponse(res, 200, "House updated successfully", { house });
});

// Delete House
const deleteHouse = asyncHandler(async (req, res) => {
  const house = await House.findById(req.params.id);

  if (!house) {
    throw new ApiError(404, "House not found");
  }

  const studentsWithHouse = await Student.countDocuments({ "academic.house": house._id });
  if (studentsWithHouse > 0) {
    throw new ApiError(400, `Cannot delete house — ${studentsWithHouse} student(s) are currently assigned to it`);
  }

  await house.deleteOne();

  return sendResponse(res, 200, "House deleted successfully");
});

module.exports = {
  createHouse,
  getAllHouses,
  getHouseById,
  updateHouse,
  deleteHouse,
};