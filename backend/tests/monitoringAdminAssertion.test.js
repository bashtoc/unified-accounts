process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-with-enough-length";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-enough-length";
process.env.OTP_PEPPER = "test-otp-pepper";
process.env.API_KEY_PEPPER = "test-api-key-pepper";

const crypto = require("crypto");
const { verifyMonitoringAdminAssertion } = require("../src/utils/crypto");

const createAssertion = ({ secret, method = "GET", path = "/admin/business-applications", expiresIn = 60 } = {}) => {
  const now = Math.floor(Date.now() / 1000);
  const encodedPayload = Buffer.from(JSON.stringify({
    sub: "admin-123",
    email: "admin@example.com",
    iat: now,
    exp: now + expiresIn,
    jti: crypto.randomUUID(),
    method,
    path,
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
};

describe("monitoring administrator assertions", () => {
  it("accepts a valid short-lived assertion for the exact request", () => {
    const assertion = createAssertion({ secret: "a-secret-that-is-at-least-32-characters-long" });
    expect(verifyMonitoringAdminAssertion(assertion, "a-secret-that-is-at-least-32-characters-long", "GET", "/admin/business-applications")).toMatchObject({ id: "admin-123", email: "admin@example.com" });
  });

  it("rejects assertions with a different method or path", () => {
    const assertion = createAssertion({ secret: "a-secret-that-is-at-least-32-characters-long" });
    expect(verifyMonitoringAdminAssertion(assertion, "a-secret-that-is-at-least-32-characters-long", "POST", "/admin/business-applications")).toBeNull();
    expect(verifyMonitoringAdminAssertion(assertion, "a-secret-that-is-at-least-32-characters-long", "GET", "/admin/business-applications/other")).toBeNull();
  });

  it("rejects expired assertions", () => {
    const assertion = createAssertion({ secret: "a-secret-that-is-at-least-32-characters-long", expiresIn: -1 });
    expect(verifyMonitoringAdminAssertion(assertion, "a-secret-that-is-at-least-32-characters-long", "GET", "/admin/business-applications")).toBeNull();
  });
});
