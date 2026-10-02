process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-with-enough-length";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-enough-length";
process.env.OTP_PEPPER = "test-otp-pepper";
process.env.API_KEY_PEPPER = "test-api-key-pepper";

const request = require("supertest");
const { createApp } = require("../src/app");

describe("monitoring API surface", () => {
  it("serves health checks in the standard response shape", async () => {
    const response = await request(createApp()).get("/health").expect(200);
    expect(response.body).toEqual({ success: true, data: { status: "ok" }, meta: {} });
  });

  it("does not expose the removed account or public report routes", async () => {
    await request(createApp()).post("/api/v1/auth/register").send({}).expect(404);
    await request(createApp()).post("/api/v1/banks/report").send({}).expect(404);
    await request(createApp()).post("/api/v1/business/banks/transaction-status").send({}).expect(404);
  });

  it("protects merchant account eligibility behind an API key", async () => {
    const response = await request(createApp()).get("/api/v1/merchant/account").expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("requires an API key for transaction-status ingestion", async () => {
    const response = await request(createApp()).post("/api/v1/banks/transaction-status").send({}).expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("keeps Signal administrator authentication separate from business access", async () => {
    await request(createApp()).get("/api/v1/admin/auth/me").expect(401);
    await request(createApp()).get("/api/v1/admin/business-applications").expect(401);
  });
});
