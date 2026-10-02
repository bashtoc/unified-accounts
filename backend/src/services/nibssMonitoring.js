"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.syncNibssStatus = exports.isNibss = exports.deriveNibssHealth = exports.NIBSS_DOWN_THRESHOLD = exports.NIBSS_BANK_CODE = void 0;

var _monitoringScoring = require("./monitoringScoring");

const NIBSS_BANK_CODE = exports.NIBSS_BANK_CODE = "NIBSS";
const NIBSS_DOWN_THRESHOLD = exports.NIBSS_DOWN_THRESHOLD = 5;

function isNibss(bank) {
  return bank?.bankCode === NIBSS_BANK_CODE || bank?.bankType === "network-switch";
}
exports.isNibss = isNibss;

function deriveNibssHealth(allBanks) {
  const downBanks = (Array.isArray(allBanks) ? allBanks : [])
    .filter(bank => bank?.active !== false && !isNibss(bank))
    .filter(bank => (0, _monitoringScoring.healthFor)(bank).status === "down")
    .map(bank => ({ id: bank.id, name: bank.name, bankCode: bank.bankCode }));
  const isDown = downBanks.length >= NIBSS_DOWN_THRESHOLD;

  return {
    status: isDown ? "down" : "healthy",
    networkSignal: isDown ? "negative" : "positive",
    trustScore: isDown ? 0 : 100,
    successRate: isDown ? 0 : 100,
    latencyMs: null,
    downBankCount: downBanks.length,
    downThreshold: NIBSS_DOWN_THRESHOLD,
    downBanks
  };
}
exports.deriveNibssHealth = deriveNibssHealth;

async function syncNibssStatus(tx, now = new Date()) {
  const allBanks = await tx.bank.findMany({ where: { active: true } });
  const nibss = allBanks.find(isNibss);
  const health = deriveNibssHealth(allBanks);
  if (!nibss) return { bank: null, health, eventId: null };

  const changed = nibss.status !== health.status;
  const next = await tx.bank.update({
    where: { id: nibss.id },
    data: {
      status: health.status,
      trustScore: health.trustScore,
      ...(changed ? { statusUpdatedAt: now } : {}),
      lastCheckedAt: now,
      statusSource: "aggregate-monitor"
    }
  });

  let eventId = null;
  if (changed) {
    const event = await tx.bankStatusEvent.create({
      data: {
        bankId: nibss.id,
        status: health.status,
        trustScore: health.trustScore,
        source: "aggregate-monitor",
        details: {
          success: health.status === "healthy",
          countsAgainstUptime: true,
          impact: health.networkSignal,
          reason: "bank_outage_threshold",
          downBankCount: health.downBankCount,
          downThreshold: health.downThreshold,
          downBanks: health.downBanks
        }
      }
    });
    eventId = event.id;
  }

  return { bank: next, health, eventId };
}
exports.syncNibssStatus = syncNibssStatus;
