const Category = require("../models/categoryModel");
const Student = require("../models/studentModel");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const checkDuplicate = require("../utils/checkDuplicate");
const buildSearchFilter = require("../utils/buildSearchFilter");
const { getPagination, paginateQuery } = require("../utils/paginate");

// Create Category
const createCategory = asyncHandler(async (req, res) => {
  const { categoryName, categoryCode, description, active } = req.body;

  await checkDuplicate(Category, { categoryName }, "Category already exists");

  const category = await Category.create({
    categoryName,
    categoryCode,
    description,
    active,
  });

  return sendResponse(res, 201, "Category created successfully", { category });
});

// Get All Categories
const getAllCategories = asyncHandler(async (req, res) => {
  const { search, active } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active === "true";

  const searchFilter = buildSearchFilter(search, ["categoryName", "categoryCode", "description"]);
  if (searchFilter) Object.assign(filter, searchFilter);

  const pagination = getPagination(req);

  const { data: categories, pagination: paginationInfo } = await paginateQuery(
    Category,
    filter,
    pagination,
    { sort: { categoryName: 1 } }
  );

  return sendResponse(res, 200, "Categories fetched successfully", { categories, pagination: paginationInfo });
});

// Get Category By Id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return sendResponse(res, 200, "Category fetched successfully", { category });
});

// Update Category
const updateCategory = asyncHandler(async (req, res) => {
  const { categoryName, categoryCode, description, active } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (categoryName && categoryName !== category.categoryName) {
    await checkDuplicate(Category, { categoryName }, "Category name already exists", category._id);
    category.categoryName = categoryName;
  }

  if (categoryCode !== undefined) category.categoryCode = categoryCode;
  if (description !== undefined) category.description = description;
  if (active !== undefined) category.active = active;

  await category.save();

  return sendResponse(res, 200, "Category updated successfully", { category });
});

// Delete Category
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const studentsWithCategory = await Student.countDocuments({
    "personal.category": category._id,
  });

  if (studentsWithCategory > 0) {
    throw new ApiError(400, `Cannot delete category — ${studentsWithCategory} student(s) are currently assigned to it`);
  }

  await category.deleteOne();

  return sendResponse(res, 200, "Category deleted successfully");
});

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};