// Reads page/limit from query params, returns { page, limit, skip }
const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Runs Model.find(filter) + Model.countDocuments(filter) in parallel,
// and returns everything the response needs: data + pagination metadata.
const paginateQuery = async (Model, filter, { page, limit, skip }, options = {}) => {
  const { populate, sort, select } = options;

  let query = Model.find(filter);
  if (populate) query = query.populate(populate);
  if (sort) query = query.sort(sort);
  if (select) query = query.select(select);
  query = query.skip(skip).limit(limit);

  const [data, total] = await Promise.all([
    query,
    Model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = { getPagination, paginateQuery };