// Escapes regex special characters so user input is matched as plain text.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_SEARCH_LENGTH = 100;

// Builds a MongoDB $or/$regex filter for case-insensitive partial text search
// across multiple fields. Returns null if there is no usable search term,
// so the caller can safely skip merging it into the filter.
const buildSearchFilter = (search, fields) => {
  // ?search=a&search=b or ?search[]=a arrive as arrays/objects, so only accept strings
  if (typeof search !== "string") return null;

  const term = search.trim().slice(0, MAX_SEARCH_LENGTH);
  if (!term) return null;

  const pattern = escapeRegex(term);

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: pattern, $options: "i" },
    })),
  };
};

module.exports = buildSearchFilter;