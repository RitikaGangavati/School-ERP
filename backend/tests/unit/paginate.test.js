const { getPagination } = require("../../utils/paginate");

describe("getPagination", () => {
  test("uses page 1 and limit 20 by default", () => {
    expect(getPagination({ query: {} })).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  test("caps limit at 100", () => {
    expect(getPagination({ query: { limit: "9999" } }).limit).toBe(100);
  });

  test("calculates skip for page 3", () => {
    expect(getPagination({ query: { page: "3", limit: "10" } }).skip).toBe(20);
  });
});