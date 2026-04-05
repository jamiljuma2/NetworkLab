const request = require("supertest");
const { createApp } = require("../src/app");
const { inMemory } = require("../src/services/store");
const { stopAllScans } = require("../src/services/scanEngine");

describe("Auth and protected endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    inMemory.users = [];
    inMemory.scans = [];
    inMemory.activities = [];
  });

  afterEach(() => {
    stopAllScans();
  });

  test("signup and me flow", async () => {
    const signup = await request(app).post("/api/auth/signup").send({
      email: "student@test.local",
      name: "Student",
      password: "VeryStrongPass123!",
      role: "Student",
    });

    expect(signup.status).toBe(201);
    expect(signup.body.token).toBeDefined();

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${signup.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.email).toBe("student@test.local");
  });

  test("protected route denies missing token", async () => {
    const res = await request(app).get("/api/scans");
    expect(res.status).toBe(401);
  });
});
