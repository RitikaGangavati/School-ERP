const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const db = require("../setup/db");
const { loginAs } = require("../setup/helpers");
const Class = require("../../models/classModel");
const Section = require("../../models/sectionModel");

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// a fresh Admin token before every test (the database is emptied after each one)
let token;
beforeEach(async () => {
  token = await loginAs(app, "Admin");
});

// ---------- access control on every route ----------
const someId = new mongoose.Types.ObjectId().toString();
const allRoutes = [
  ["post", "/api/classes/create"],
  ["get", "/api/classes/list"],
  ["get", `/api/classes/details/${someId}`],
  ["put", `/api/classes/update/${someId}`],
  ["delete", `/api/classes/delete/${someId}`],
];

describe("access control", () => {
  test.each(allRoutes)("no token: %s %s returns 401", async (method, url) => {
    const res = await request(app)[method](url).send({});
    expect(res.status).toBe(401);
  });

  test.each(allRoutes)("a Teacher: %s %s returns 403", async (method, url) => {
    const teacherToken = await loginAs(app, "Teacher");
    const res = await request(app)[method](url).set(bearer(teacherToken)).send({});
    expect(res.status).toBe(403);
  });
});

// ---------- create ----------
describe("POST /api/classes/create", () => {
  test("creates a class with defaults (201)", async () => {
    const res = await request(app)
      .post("/api/classes/create")
      .set(bearer(token))
      .send({ className: "Class 1" });

    expect(res.status).toBe(201);
    expect(res.body.class.className).toBe("Class 1");
    expect(res.body.class.active).toBe(true);
    expect(res.body.class.sections).toEqual([]);
    expect(await Class.countDocuments({ className: "Class 1" })).toBe(1);
  });

  test("trims spaces around the name", async () => {
    const res = await request(app)
      .post("/api/classes/create")
      .set(bearer(token))
      .send({ className: "   Class 2   " });

    expect(res.status).toBe(201);
    expect(res.body.class.className).toBe("Class 2");
  });

  test("returns the linked sections populated with their names", async () => {
    const section = await Section.create({ sectionName: "a" }); // model uppercases it
    const res = await request(app)
      .post("/api/classes/create")
      .set(bearer(token))
      .send({ className: "Class 3", sections: [section._id.toString()] });

    expect(res.status).toBe(201);
    expect(res.body.class.sections[0].sectionName).toBe("A");
  });

  test("a duplicate name returns 409", async () => {
    await Class.create({ className: "Class 1" });
    const res = await request(app)
      .post("/api/classes/create")
      .set(bearer(token))
      .send({ className: "Class 1" });

    expect(res.status).toBe(409);
    expect(await Class.countDocuments()).toBe(1);
  });

  test("a missing className returns 400 with a field error", async () => {
    const res = await request(app).post("/api/classes/create").set(bearer(token)).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("className");
  });

  test("an invalid section id returns 400", async () => {
    const res = await request(app)
      .post("/api/classes/create")
      .set(bearer(token))
      .send({ className: "Class 4", sections: ["not-an-id"] });

    expect(res.status).toBe(400);
    expect(await Class.countDocuments()).toBe(0);
  });
});

// ---------- list ----------
describe("GET /api/classes/list", () => {
  test("paginates and sorts by name", async () => {
    await Class.insertMany([
      { className: "Class 3" },
      { className: "Class 1" },
      { className: "Class 2" },
    ]);

    const page1 = await request(app).get("/api/classes/list?page=1&limit=2").set(bearer(token));
    expect(page1.status).toBe(200);
    expect(page1.body.classes.map((c) => c.className)).toEqual(["Class 1", "Class 2"]);
    expect(page1.body.pagination.total).toBe(3);
    expect(page1.body.pagination.totalPages).toBe(2);

    const page2 = await request(app).get("/api/classes/list?page=2&limit=2").set(bearer(token));
    expect(page2.body.classes.map((c) => c.className)).toEqual(["Class 3"]);
  });

  test("limit is capped at 100", async () => {
    const res = await request(app).get("/api/classes/list?limit=9999").set(bearer(token));
    expect(res.body.pagination.limit).toBe(100);
  });

  test("search is case-insensitive and matches part of the name", async () => {
    await Class.insertMany([{ className: "Class 1" }, { className: "Nursery" }]);

    const res = await request(app).get("/api/classes/list?search=nurs").set(bearer(token));
    expect(res.body.classes).toHaveLength(1);
    expect(res.body.classes[0].className).toBe("Nursery");
  });

  test("regex characters in search are treated as plain text", async () => {
    await Class.insertMany([{ className: "Class 1" }, { className: "Nursery" }]);

    // if ".*" were treated as a regex it would match everything
    const res = await request(app).get("/api/classes/list?search=.*").set(bearer(token));
    expect(res.body.classes).toHaveLength(0);
  });

  test("filters by active status", async () => {
    await Class.insertMany([
      { className: "Class 1", active: true },
      { className: "Class 2", active: false },
    ]);

    const res = await request(app).get("/api/classes/list?active=false").set(bearer(token));
    expect(res.body.classes).toHaveLength(1);
    expect(res.body.classes[0].className).toBe("Class 2");
  });
});

// ---------- details ----------
describe("GET /api/classes/details/:id", () => {
  test("returns the class (200)", async () => {
    const created = await Class.create({ className: "Class 1" });
    const res = await request(app)
      .get(`/api/classes/details/${created._id}`)
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.class.className).toBe("Class 1");
  });

  test("an unknown id returns 404", async () => {
    const res = await request(app).get(`/api/classes/details/${someId}`).set(bearer(token));
    expect(res.status).toBe(404);
  });

  test("a malformed id returns 400", async () => {
    const res = await request(app).get("/api/classes/details/123").set(bearer(token));
    expect(res.status).toBe(400);
  });
});

// ---------- update ----------
describe("PUT /api/classes/update/:id", () => {
  test("renames a class (200) and saves it", async () => {
    const created = await Class.create({ className: "Class 1" });
    const res = await request(app)
      .put(`/api/classes/update/${created._id}`)
      .set(bearer(token))
      .send({ className: "Class One" });

    expect(res.status).toBe(200);
    expect(res.body.class.className).toBe("Class One");
    expect((await Class.findById(created._id)).className).toBe("Class One");
  });

  test("renaming to its own current name is allowed", async () => {
    const created = await Class.create({ className: "Class 1" });
    const res = await request(app)
      .put(`/api/classes/update/${created._id}`)
      .set(bearer(token))
      .send({ className: "Class 1" });

    expect(res.status).toBe(200);
  });

  test("renaming to another class's name returns 409", async () => {
    await Class.create({ className: "Class 1" });
    const second = await Class.create({ className: "Class 2" });

    const res = await request(app)
      .put(`/api/classes/update/${second._id}`)
      .set(bearer(token))
      .send({ className: "Class 1" });

    expect(res.status).toBe(409);
    expect((await Class.findById(second._id)).className).toBe("Class 2");
  });

  test("deactivates a class", async () => {
    const created = await Class.create({ className: "Class 1" });
    const res = await request(app)
      .put(`/api/classes/update/${created._id}`)
      .set(bearer(token))
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.class.active).toBe(false);
  });

  test("an empty body returns 400", async () => {
    const created = await Class.create({ className: "Class 1" });
    const res = await request(app)
      .put(`/api/classes/update/${created._id}`)
      .set(bearer(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe("At least one field is required");
  });

  test("an unknown id returns 404", async () => {
    const res = await request(app)
      .put(`/api/classes/update/${someId}`)
      .set(bearer(token))
      .send({ className: "Whatever" });

    expect(res.status).toBe(404);
  });
});

// ---------- delete ----------
describe("DELETE /api/classes/delete/:id", () => {
  test("deletes the class (200) and it is really gone", async () => {
    const created = await Class.create({ className: "Class 1" });
    const res = await request(app)
      .delete(`/api/classes/delete/${created._id}`)
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(await Class.findById(created._id)).toBeNull();
  });

  test("deleting the same class again returns 404", async () => {
    const created = await Class.create({ className: "Class 1" });
    await request(app).delete(`/api/classes/delete/${created._id}`).set(bearer(token));

    const again = await request(app)
      .delete(`/api/classes/delete/${created._id}`)
      .set(bearer(token));
    expect(again.status).toBe(404);
  });
});