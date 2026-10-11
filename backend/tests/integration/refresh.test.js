const request = require("supertest");
const app = require("../../app");
const db = require("../setup/db");
const { createUser, login } = require("../setup/helpers");
const User = require("../../models/userModel");

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const refresh = (cookie) => {
  const req = request(app).post("/api/auth/refresh");
  return cookie ? req.set("Cookie", cookie) : req;
};

describe("POST /api/auth/refresh", () => {
  test("no cookie returns 401", async () => {
    const res = await refresh();
    expect(res.status).toBe(401);
  });

  test("a garbage cookie returns 401", async () => {
    const res = await refresh("refreshToken=not.a.real.token");
    expect(res.status).toBe(401);
  });

  test("a valid cookie returns a new access token and a NEW refresh cookie", async () => {
    await createUser();
    const { cookie } = await login(app);

    const res = await refresh(cookie);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    const newCookie = res.headers["set-cookie"][0].split(";")[0];
    expect(newCookie).toContain("refreshToken=");
    expect(newCookie).not.toBe(cookie); // rotated
  });

  test("reusing an old refresh cookie is rejected AND revokes every session", async () => {
    await createUser();
    const { cookie: oldCookie } = await login(app);

    const first = await refresh(oldCookie);
    expect(first.status).toBe(200);
    const newCookie = first.headers["set-cookie"][0].split(";")[0];

    // the old cookie was already used, so it looks stolen
    const reuse = await refresh(oldCookie);
    expect(reuse.status).toBe(401);

    // and now even the legitimate new cookie is dead
    const afterTheft = await refresh(newCookie);
    expect(afterTheft.status).toBe(401);
  });

  test("a deactivated user cannot refresh", async () => {
    await createUser();
    const { cookie } = await login(app);

    await User.updateOne({ email: "asha@test.com" }, { active: false });

    const res = await refresh(cookie);
    expect(res.status).toBe(401);
  });
});

describe("refresh token storage", () => {
  test("only a hash is stored, never the real token", async () => {
    await createUser();
    const { cookie } = await login(app);
    const rawToken = cookie.split("=")[1];

    // refreshTokens is select:false, so ask for it explicitly
    const user = await User.findOne({ email: "asha@test.com" }).select("+refreshTokens");

    expect(user.refreshTokens).toHaveLength(1);
    expect(user.refreshTokens[0].tokenHash).not.toBe(rawToken);
    expect(user.refreshTokens[0].tokenHash).toHaveLength(64); // sha256 in hex
  });

  test("keeps at most 5 devices", async () => {
    await createUser();
    for (let i = 0; i < 6; i++) {
      await login(app);
    }

    const user = await User.findOne({ email: "asha@test.com" }).select("+refreshTokens");
    expect(user.refreshTokens).toHaveLength(5);
  });
});

describe("POST /api/auth/logout", () => {
  test("after logout the same cookie can no longer refresh", async () => {
    await createUser();
    const { cookie } = await login(app);

    const out = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(out.status).toBe(200);

    const res = await refresh(cookie);
    expect(res.status).toBe(401);
  });

  test("logout without a cookie still succeeds", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });
});