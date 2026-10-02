const { asChecks, classifyTransaction, healthFor } = require("../src/services/monitoringScoring");

describe("monitoring scoring", () => {
  it("only uses score-affecting signals in the uptime window", () => {
    expect(asChecks([
      { success: true, countsAgainstUptime: false },
      { success: true, countsAgainstUptime: true },
      false
    ])).toHaveLength(2);
  });

  it("treats bank failures as negative and customer failures as neutral", () => {
    expect(classifyTransaction({ status: "FAILED", failureCategory: "BANK_TIMEOUT" })).toMatchObject({ impact: "negative", countsAgainstUptime: true, success: false });
    expect(classifyTransaction({ status: "FAILED", failureCategory: "INSUFFICIENT_FUNDS" })).toMatchObject({ impact: "neutral", countsAgainstUptime: false, success: false });
    expect(classifyTransaction({ status: "SUCCESS" })).toMatchObject({ impact: "positive", countsAgainstUptime: true, success: true });
  });

  it("projects health from the rolling signal window", () => {
    expect(healthFor({ status: "normal", trustScore: 50, recentReports: [
      { success: true, latencyMs: 100 },
      { success: true, latencyMs: 120 },
      { success: false, latencyMs: 300 },
      { success: false, latencyMs: 350 },
      { success: false, latencyMs: 400 }
    ] })).toMatchObject({ status: "down", successRate: 40 });
  });
});
