"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bankService = exports.BankService = void 0;
var _prisma = require("../config/prisma");
var _bankRepository = require("../repositories/bankRepository");
var _errors = require("../utils/errors");
var _monitoringScoring = require("./monitoringScoring");
var _nibssMonitoring = require("./nibssMonitoring");

const banks = new _bankRepository.BankRepository();

function generatedLogoPath(bankCode) {
  return `/bank-logos/generated/${encodeURIComponent(bankCode)}.svg`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function logoInitials(name) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map(word => word[0]) : [String(name).slice(0, 2)])
    .join('')
    .toUpperCase();
}

function generatedLogoSvg(bank) {
  const initials = logoInitials(bank.name);
  const palette = ['#0b5cff', '#16a572', '#6d55d9', '#d3542f', '#a73764', '#1d728f'];
  const hash = Array.from(`${bank.bankCode}:${bank.name}`).reduce((total, character) => total + character.charCodeAt(0), 0);
  const color = palette[hash % palette.length];
  const name = escapeXml(bank.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-labelledby="title"><title id="title">${name} logo</title><rect width="96" height="96" rx="22" fill="${color}"/><rect x="12" y="12" width="72" height="72" rx="17" fill="white" fill-opacity=".12"/><text x="48" y="57" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" fill="white">${escapeXml(initials)}</text></svg>`;
}

function serialize(bank, networkHealth) {
  const isNetworkSwitch = (0, _nibssMonitoring.isNibss)(bank);
  const health = isNetworkSwitch && networkHealth
    ? networkHealth
    : (0, _monitoringScoring.healthFor)(bank);
  return {
    id: bank.id,
    name: bank.name,
    slug: bank.slug,
    bankCode: bank.bankCode,
    longCode: bank.longCode || null,
    nipInstitutionCode: bank.nipInstitutionCode || null,
    supportsTransfer: bank.supportsTransfer,
    country: bank.country,
    currency: bank.currency,
    bankType: bank.bankType || null,
    institutionType: isNetworkSwitch ? "network_switch" : "bank",
    isNetworkSwitch,
    logoUrl: bank.logoUrl || generatedLogoPath(bank.bankCode),
    featured: bank.featured,
    displayOrder: bank.displayOrder,
    status: health.status,
    trustScore: health.trustScore,
    successRate: health.successRate,
    latencyMs: health.latencyMs,
    lastCheckedAt: bank.lastCheckedAt || bank.statusUpdatedAt,
    statusSource: bank.statusSource || 'system',
    updatedAt: bank.updatedAt,
    ...(isNetworkSwitch ? {
      networkSignal: health.networkSignal,
      downBankCount: health.downBankCount,
      downThreshold: health.downThreshold
    } : {})
  };
}

function serializeAll(allBanks) {
  const networkHealth = (0, _nibssMonitoring.deriveNibssHealth)(allBanks);
  return [...allBanks]
    .sort((left, right) => Number((0, _nibssMonitoring.isNibss)(right)) - Number((0, _nibssMonitoring.isNibss)(left)) || left.name.localeCompare(right.name))
    .map(bank => serialize(bank, networkHealth));
}

class BankService {
  async list() {
    return serializeAll(await banks.list());
  }

  async getStatus() {
    const allBanks = await banks.list();
    const result = {};
    for (const bank of serializeAll(allBanks)) result[bank.bankCode] = bank;
    return result;
  }

  async transactionStatus({ bankCode, transactionId, status, failureCategory, latencyMs, source = "business-api" }) {
    const bank = await banks.findByCode(bankCode);
    if (!bank) throw (0, _errors.notFound)("Bank not found.");
    if ((0, _nibssMonitoring.isNibss)(bank)) {
      throw (0, _errors.badRequest)("NIBSS status is derived from aggregate bank availability and does not accept direct transaction outcomes.");
    }

    const normalizedLatency = latencyMs === undefined || latencyMs === null
      ? null
      : Math.max(0, Math.round(Number(latencyMs)));
    if (normalizedLatency !== null && !Number.isFinite(normalizedLatency)) {
      throw (0, _errors.badRequest)("latencyMs must be a number.");
    }

    const classification = (0, _monitoringScoring.classifyTransaction)({ status, failureCategory });
    const signal = {
      transactionId,
      transactionStatus: status,
      failureCategory: failureCategory || null,
      countsAgainstUptime: classification.countsAgainstUptime,
      success: classification.success,
      impact: classification.impact,
      reason: classification.reason
    };

    return _prisma.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM Bank WHERE bankCode = ${_nibssMonitoring.NIBSS_BANK_CODE} AND active = 1 FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM Bank WHERE id = ${bank.id} AND active = 1 FOR UPDATE`;
      const current = await tx.bank.findUnique({ where: { id: bank.id } });
      if (!current || !current.active) throw (0, _errors.notFound)("Bank not found.");

      const duplicate = await tx.bankStatusEvent.findFirst({
        where: { bankId: current.id, transactionId }
      });
      if (duplicate) {
        const nibss = await (0, _nibssMonitoring.syncNibssStatus)(tx);
        return {
          bank: serialize(current),
          nibss: nibss.bank ? serialize(nibss.bank, nibss.health) : null,
          signal: { ...signal, duplicate: true },
          eventId: duplicate.id
        };
      }

      const now = new Date();
      const scoringHistory = (0, _monitoringScoring.asChecks)(current.recentReports);
      if (classification.countsAgainstUptime) {
        scoringHistory.push({
          success: classification.success,
          latencyMs: normalizedLatency,
          transactionId,
          countsAgainstUptime: true,
          checkedAt: now.toISOString()
        });
        if (scoringHistory.length > 100) scoringHistory.shift();
      }

      const projected = (0, _monitoringScoring.healthFor)({
        ...current,
        recentReports: classification.countsAgainstUptime ? scoringHistory : current.recentReports
      });
      const next = classification.countsAgainstUptime
        ? await tx.bank.update({
          where: { id: current.id },
          data: {
            recentReports: scoringHistory,
            status: projected.status,
            trustScore: projected.trustScore,
            latencyMs: projected.latencyMs,
            statusUpdatedAt: now,
            lastCheckedAt: now,
            statusSource: source
          }
        })
        : current;

      const event = await tx.bankStatusEvent.create({
        data: {
          bankId: current.id,
          transactionId,
          status: projected.status,
          trustScore: projected.trustScore,
          latencyMs: normalizedLatency,
          source,
          details: signal
        }
      });
      const nibss = await (0, _nibssMonitoring.syncNibssStatus)(tx, now);
      return {
        bank: serialize(next),
        nibss: nibss.bank ? serialize(nibss.bank, nibss.health) : null,
        signal,
        eventId: event.id
      };
    });
  }

  async history(bankId, limit = 50) {
    const bank = await banks.findById(bankId);
    if (!bank) throw (0, _errors.notFound)('Bank was not found.');
    return _prisma.prisma.bankStatusEvent.findMany({
      where: { bankId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(Number(limit) || 50, 1), 100)
    });
  }

  async get(id) {
    const bank = await banks.findById(id);
    if (!bank) throw (0, _errors.notFound)('Bank was not found.');
    if (!(0, _nibssMonitoring.isNibss)(bank)) return serialize(bank);
    const allBanks = await banks.list();
    return serialize(bank, (0, _nibssMonitoring.deriveNibssHealth)(allBanks));
  }

  async getGeneratedLogo(bankCode) {
    const bank = await banks.findByCode(bankCode);
    if (!bank) throw (0, _errors.notFound)('Bank was not found.');
    return generatedLogoSvg(bank);
  }
}

exports.BankService = BankService;
const bankService = exports.bankService = new BankService();
