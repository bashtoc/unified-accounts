process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-with-enough-length";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-enough-length";
process.env.OTP_PEPPER = "test-otp-pepper";
process.env.API_KEY_PEPPER = "test-api-key-pepper";

const { signMonitoringAdminAccessToken, verifyMonitoringAdminAccessToken } = require("../src/utils/tokens");

describe("native monitoring administrator sessions", () => {
  it("accepts a Signal operator token and preserves identity claims", () => {
    const token = signMonitoringAdminAccessToken({ sub: "admin-123", email: "operator@saference.com", role: "OWNER" });
    expect(verifyMonitoringAdminAccessToken(token)).toMatchObject({ sub: "admin-123", email: "operator@saference.com", role: "OWNER", type: "monitoring_admin" });
  });

  it("rejects business access tokens at the monitoring administrator boundary", () => {
    const { signAccessToken } = require("../src/utils/tokens");
    const token = signAccessToken({ sub: "business-123" });
    expect(() => verifyMonitoringAdminAccessToken(token)).toThrow();
  });
});
