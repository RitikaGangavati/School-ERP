const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../../app");
const db = require("../setup/db");
const { createUser, loginAs } = require("../setup/helpers");
const User = require("../../models/userModel");
const Role = require("../../models/roleModel");

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe("protect middleware (GET /api/roles/list)", () => {
  test("no Authorization header returns 401", async () => {
    const res = await request(app).get("/api/roles/list");
    expect(res.status).toBe(401);
  });

  test("a header without 'Bearer ' returns 401", async () => {
    const res = await request(app).get("/api/roles/list").set("Authorization", "abc123");
    expect(res.status).toBe(401);
  });

  test("a garbage token returns 401", async () => {
    const res = await request(app).get("/api/roles/list").set(bearer("abc.def.ghi"));
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  test("a token signed with the wrong secret returns 401", async () => {
    const user = await createUser({ roleName: "Admin" });
    const forged = jwt.sign({ id: user._id }, "some-other-secret", { expiresIn: "15m" });

    const res = await request(app).get("/api/roles/list").set(bearer(forged));
    expect(res.status).toBe(401);
  });

  test("an expired token returns 401 with code TOKEN_EXPIRED", async () => {
    const user = await createUser({ roleName: "Admin" });
    const expired = jwt.sign(
      { id: user._id, exp: Math.floor(Date.now() / 1000) - 60 }, // expired 1 minute ago
      process.env.JWT_SECRET
    );

    const res = await request(app).get("/api/roles/list").set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("TOKEN_EXPIRED");
  });

  test("a valid token for a user that does not exist returns 401", async () => {
    const ghost = jwt.sign({ id: new mongoose.Types.ObjectId() }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const res = await request(app).get("/api/roles/list").set(bearer(ghost));
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("User no longer exists");
  });

  test("a soft-deleted user's token stops working (401)", async () => {
    const token = await loginAs(app, "Admin");
    await User.updateOne({ email: "admin@test.com" }, { isDeleted: true });

    const res = await request(app).get("/api/roles/list").set(bearer(token));
    expect(res.status).toBe(401);
  });

  test("a deactivated user's token stops working (403)", async () => {
    const token = await loginAs(app, "Admin");
    await User.updateOne({ email: "admin@test.com" }, { active: false });

    const res = await request(app).get("/api/roles/list").set(bearer(token));
    expect(res.status).toBe(403);
  });

  test("a token stops working when the user's role is deactivated (403)", async () => {
    const token = await loginAs(app, "Admin");
    await Role.updateOne({ roleName: "Admin" }, { active: false });

    const res = await request(app).get("/api/roles/list").set(bearer(token));
    expect(res.status).toBe(403);
  });
});

describe("role routes: who can do what", () => {
  test("a Teacher cannot list roles (403)", async () => {
    const token = await loginAs(app, "Teacher");
    const res = await request(app).get("/api/roles/list").set(bearer(token));

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not authorized to perform this action");
  });

  test("an Admin can list roles (200)", async () => {
    const token = await loginAs(app, "Admin");
    const res = await request(app).get("/api/roles/list").set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.roles.length).toBeGreaterThanOrEqual(1);
  });

  test("a Teacher cannot create a role, and nothing is saved", async () => {
    const token = await loginAs(app, "Teacher");
    const res = await request(app)
      .post("/api/roles/create")
      .set(bearer(token))
      .send({ roleName: "Hacker" });

    expect(res.status).toBe(403);
    expect(await Role.findOne({ roleName: "Hacker" })).toBeNull();
  });

  test("a Teacher with an INVALID body still gets 403, not 400", async () => {
    // authorize() runs before validate(), so the role check wins
    const token = await loginAs(app, "Teacher");
    const res = await request(app)
      .post("/api/roles/create")
      .set(bearer(token))
      .send({ roleName: "" });

    expect(res.status).toBe(403);
  });

  test("an Admin can create a role (201)", async () => {
    const token = await loginAs(app, "Admin");
    const res = await request(app)
      .post("/api/roles/create")
      .set(bearer(token))
      .send({ roleName: "Accountant" });

    expect(res.status).toBe(201);
    expect(res.body.role.roleName).toBe("Accountant");
  });

  test("creating the same role twice returns 409", async () => {
    const token = await loginAs(app, "Admin");
    await request(app).post("/api/roles/create").set(bearer(token)).send({ roleName: "Accountant" });

    const res = await request(app)
      .post("/api/roles/create")
      .set(bearer(token))
      .send({ roleName: "Accountant" });

    expect(res.status).toBe(409);
  });

  test("an Admin sending an empty roleName gets 400 with a field error", async () => {
    const token = await loginAs(app, "Admin");
    const res = await request(app)
      .post("/api/roles/create")
      .set(bearer(token))
      .send({ roleName: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("roleName");
  });

  test("a malformed id returns 400, an unknown valid id returns 404", async () => {
    const token = await loginAs(app, "Admin");

    const bad = await request(app).get("/api/roles/details/123").set(bearer(token));
    expect(bad.status).toBe(400);

    const missing = await request(app)
      .get(`/api/roles/details/${new mongoose.Types.ObjectId()}`)
      .set(bearer(token));
    expect(missing.status).toBe(404);
  });

  test("the 'Super Admin' role can never be deleted (403)", async () => {
    const token = await loginAs(app, "Super Admin");
    const superRole = await Role.findOne({ roleName: "Super Admin" });

    const res = await request(app)
      .delete(`/api/roles/delete/${superRole._id}`)
      .set(bearer(token));

    expect(res.status).toBe(403);
    expect(await Role.findById(superRole._id)).not.toBeNull();
  });

  test("a role that still has users cannot be deleted (400)", async () => {
    const token = await loginAs(app, "Admin");
    await createUser({ roleName: "Teacher", email: "teacher@test.com" });
    const teacherRole = await Role.findOne({ roleName: "Teacher" });

    const res = await request(app)
      .delete(`/api/roles/delete/${teacherRole._id}`)
      .set(bearer(token));

    expect(res.status).toBe(400);
  });
});

describe("user routes: Super Admin only", () => {
  test("an Admin cannot see the deleted-users list (403)", async () => {
    const token = await loginAs(app, "Admin");
    const res = await request(app).get("/api/users/deleted-list").set(bearer(token));
    expect(res.status).toBe(403);
  });

  test("a Super Admin can see the deleted-users list (200)", async () => {
    const token = await loginAs(app, "Super Admin");
    const res = await request(app).get("/api/users/deleted-list").set(bearer(token));
    expect(res.status).toBe(200);
  });
});