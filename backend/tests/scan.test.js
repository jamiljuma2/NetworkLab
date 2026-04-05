const request = require("supertest");
const { createApp } = require("../src/app");
const { inMemory } = require("../src/services/store");
const { stopAllScans } = require("../src/services/scanEngine");

describe("Scan flow", () => {
  const app = createApp();

  beforeEach(() => {
    inMemory.users = [];
    inMemory.scans = [];
    inMemory.activities = [];
  });

  afterEach(() => {
    stopAllScans();
  });

  test("user can start quick scan", async () => {
    const signup = await request(app).post("/api/auth/signup").send({
      email: "analyst@test.local",
      name: "Analyst",
      password: "VeryStrongPass123!",
      role: "Student",
    });

    const token = signup.body.token;

    const scan = await request(app)
      .post("/api/scans/start")
      .set("Authorization", `Bearer ${token}`)
      .send({ target: "10.0.0.0/24", scanType: "quick" });

    expect(scan.status).toBe(202);
    expect(scan.body.id).toBeDefined();
    expect(scan.body.status).toBe("running");
  });
});
