"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BANK_FAILURE_CATEGORIES = exports.classifyTransaction = exports.healthFor = exports.asChecks = void 0;

const BANK_FAILURE_CATEGORIES = exports.BANK_FAILURE_CATEGORIES = new Set([
  "BANK_UNAVAILABLE",
  "BANK_TIMEOUT",
  "NETWORK_ERROR"
]);

function asChecks(recentReports) {
  return (Array.isArray(recentReports) ? recentReports : [])
    .map(report => typeof report === "boolean" ? { success: report, latencyMs: null, countsAgainstUptime: true } : report || {})
    .filter(report => typeof report.success === "boolean" && report.countsAgainstUptime !== false);
}
exports.asChecks = asChecks;

function healthFor(bank) {
  const checks = asChecks(bank.recentReports);
  if (!checks.length) {
    return {
      status: bank.status === "normal" ? "unknown" : bank.status || "unknown",
      trustScore: bank.trustScore ?? 50,
      successRate: null,
      latencyMs: bank.latencyMs ?? null
    };
  }

  const successes = checks.filter(check => check.success).length;
  const successRate = successes / checks.length;
  const latencies = checks.map(check => Number(check.latencyMs)).filter(Number.isFinite);
  const averageLatency = latencies.length
    ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
    : null;
  const latencyScore = averageLatency === null
    ? 70
    : Math.max(0, Math.min(100, 100 - Math.max(0, averageLatency - 200) / 20));
  const trustScore = Math.round(
    successRate * 70 + latencyScore * 0.2 + (successRate >= 0.8 ? 10 : successRate >= 0.5 ? 5 : 0)
  );
  const status = successRate < 0.5 ? "down" : successRate < 0.8 ? "degraded" : "healthy";
  return {
    status,
    trustScore,
    successRate: Math.round(successRate * 100),
    latencyMs: averageLatency
  };
}
exports.healthFor = healthFor;

function classifyTransaction({ status, failureCategory }) {
  if (status === "SUCCESS") {
    return {
      countsAgainstUptime: true,
      success: true,
      impact: "positive",
      reason: "transaction_success"
    };
  }

  if (status === "FAILED" && BANK_FAILURE_CATEGORIES.has(failureCategory)) {
    return {
      countsAgainstUptime: true,
      success: false,
      impact: "negative",
      reason: "bank_failure"
    };
  }

  return {
    countsAgainstUptime: false,
    success: status === "FAILED" ? false : null,
    impact: "neutral",
    reason: status === "FAILED" ? "non_bank_failure" : "non_terminal_transaction"
  };
}
exports.classifyTransaction = classifyTransaction;
