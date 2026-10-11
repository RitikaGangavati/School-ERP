const request = require("supertest");
const Role = require("../../models/roleModel");
const User = require("../../models/userModel");

// creates a user (and the role if it doesn't exist yet)
const createUser = async ({
  roleName = "Teacher",
  email = "asha@test.com",
  password = "Password123",
} = {}) => {
  const role = (await Role.findOne({ roleName })) || (await Role.create({ roleName }));
  return User.create({
    firstName: "Test",
    lastName: "User",
    email,
    password,
    mobile: "9876543210",
    role: role._id,
  });
};

// logs in through the real API; returns the access token and the refresh cookie
const login = async (app, email = "asha@test.com", password = "Password123") => {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = res.headers["set-cookie"]?.[0]?.split(";")[0]; // "refreshToken=xxxx"
  return { res, token: res.body.token, cookie };
};

// creates a user with the given role and returns an access token for them
const loginAs = async (app, roleName) => {
  const email = `${roleName.replace(/\s+/g, "").toLowerCase()}@test.com`;
  await createUser({ roleName, email });
  const { token } = await login(app, email);
  return token;
};

module.exports = { createUser, login, loginAs };