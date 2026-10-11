const request = require("supertest");
const app = require("../../app");
const db = require("../setup/db");
const Role = require("../../models/roleModel");
const User = require("../../models/userModel");

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe("basic app", () => {
  test("GET / says the backend is running", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });

  test("unknown route returns 404 JSON", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  test("rejects an invalid email with 400 and a field error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "whatever" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("email");
  });

  test("rejects an unknown user with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "Password123" });

    expect(res.status).toBe(401);
  });

  test("logs in a valid user and returns a token and refresh cookie", async () => {
    const role = await Role.create({ roleName: "Teacher" });
    await User.create({
      firstName: "Asha",
      lastName: "K",
      email: "asha@test.com",
      password: "Password123",
      mobile: "9876543210",
      role: role._id,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "asha@test.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"][0]).toContain("refreshToken=");
  });

  test("rejects a wrong password with 401", async () => {
    const role = await Role.create({ roleName: "Teacher" });
    await User.create({
      firstName: "Asha", lastName: "K", email: "asha@test.com",
      password: "Password123", mobile: "9876543210", role: role._id,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "asha@test.com", password: "WrongPassword" });

    expect(res.status).toBe(401);
  });
});