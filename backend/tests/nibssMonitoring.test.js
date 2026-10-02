const {
  NIBSS_DOWN_THRESHOLD,
  deriveNibssHealth
} = require("../src/services/nibssMonitoring");

function bank(id, status) {
  return {
    id,
    name: `Bank ${id}`,
    bankCode: String(id),
    active: true,
    status,
    recentReports: [],
    trustScore: 100
  };
}

describe("NIBSS aggregate monitoring", () => {
  it("stays positive while fewer than five banks are down", () => {
    const health = deriveNibssHealth([
      ...Array.from({ length: NIBSS_DOWN_THRESHOLD - 1 }, (_, index) => bank(index + 1, "down")),
      bank(20, "healthy")
    ]);

    expect(health).toMatchObject({
      status: "healthy",
      networkSignal: "positive",
      downBankCount: 4,
      downThreshold: 5
    });
  });

  it("turns negative when five or more banks are down", () => {
    const health = deriveNibssHealth(
      Array.from({ length: NIBSS_DOWN_THRESHOLD }, (_, index) => bank(index + 1, "down"))
    );

    expect(health).toMatchObject({
      status: "down",
      networkSignal: "negative",
      trustScore: 0,
      successRate: 0,
      downBankCount: 5
    });
  });

  it("does not count the NIBSS switch itself as a down bank", () => {
    const health = deriveNibssHealth([
      bank(1, "down"),
      { ...bank(99, "down"), bankCode: "NIBSS", bankType: "network-switch" }
    ]);

    expect(health.downBankCount).toBe(1);
  });
});
