const ApiError = require("./ApiError");

const checkDuplicate = async (Model, filter, message, excludeId = null) => {
  const query = excludeId ? { ...filter, _id: { $ne: excludeId } } : filter;
  const existing = await Model.findOne(query);

  if (existing) {
    throw new ApiError(409, message);
  }
};

module.exports = checkDuplicate;