"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantApprovalService = exports.MerchantApprovalService = void 0;
var _prisma = require("../config/prisma");
var _errors = require("../utils/errors");

const statuses = new Set(["INACTIVE", "ACTIVE", "REJECTED", "SUSPENDED", "DELETED"]);
const decisions = {
  APPROVED: { status: "ACTIVE", allowed: new Set(["INACTIVE", "REJECTED", "SUSPENDED"]) },
  REJECTED: { status: "REJECTED", allowed: new Set(["INACTIVE", "REJECTED"]) },
  SUSPENDED: { status: "SUSPENDED", allowed: new Set(["ACTIVE", "SUSPENDED"]) },
  REACTIVATED: { status: "ACTIVE", allowed: new Set(["SUSPENDED", "REJECTED", "INACTIVE"]) }
};

const userSelect = { id: true, fullName: true, email: true, phoneNumber: true, status: true, createdAt: true };
const applicationInclude = {
  user: { select: userSelect },
  apiKeys: { select: { id: true, keyPrefix: true, scopes: true, revokedAt: true, expiresAt: true, lastUsedAt: true, createdAt: true }, orderBy: { createdAt: "desc" } },
  reviews: { orderBy: { createdAt: "desc" }, take: 1 }
};

const serializeKey = (key) => ({
  id: key.id,
  keyPrefix: key.keyPrefix,
  scopes: Array.isArray(key.scopes) ? key.scopes : [],
  revokedAt: key.revokedAt,
  expiresAt: key.expiresAt,
  lastUsedAt: key.lastUsedAt,
  createdAt: key.createdAt
});

const serializeApplication = (application) => ({
  id: application.id,
  name: application.name,
  description: application.description,
  websiteUrl: application.websiteUrl,
  status: application.status,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  user: application.user,
  apiKeys: (application.apiKeys || []).map(serializeKey),
  latestReview: application.reviews?.[0] || null
});

class MerchantApprovalService {
  list = async ({ status = "INACTIVE", search = "", limit = 25, offset = 0 } = {}) => {
    const normalizedStatus = String(status || "INACTIVE").toUpperCase();
    const normalizedSearch = String(search || "").trim();
    const take = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const skip = Math.max(Number(offset) || 0, 0);
    const where = {};
    if (normalizedStatus !== "ALL") {
      if (!statuses.has(normalizedStatus)) throw (0, _errors.badRequest)("The requested business status is invalid.");
      where.status = normalizedStatus;
    }
    if (normalizedSearch) {
      where.OR = [
        { name: { contains: normalizedSearch } },
        { websiteUrl: { contains: normalizedSearch } },
        { user: { email: { contains: normalizedSearch } } },
        { user: { fullName: { contains: normalizedSearch } } }
      ];
    }
    const [applications, total] = await Promise.all([
      _prisma.prisma.developerApplication.findMany({ where, include: applicationInclude, orderBy: { createdAt: "desc" }, take, skip }),
      _prisma.prisma.developerApplication.count({ where })
    ]);
    return { applications: applications.map(serializeApplication), total, limit: take, offset: skip };
  };

  summary = async () => {
    const grouped = await _prisma.prisma.developerApplication.groupBy({ by: ["status"], _count: { _all: true } });
    const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));
    return { pending: counts.INACTIVE || 0, active: counts.ACTIVE || 0, rejected: counts.REJECTED || 0, suspended: counts.SUSPENDED || 0, total: grouped.reduce((sum, item) => sum + item._count._all, 0) };
  };

  detail = async (applicationId) => {
    const application = await _prisma.prisma.developerApplication.findUnique({ where: { id: applicationId }, include: { ...applicationInclude, reviews: { orderBy: { createdAt: "desc" }, take: 20 } } });
    if (!application) throw (0, _errors.notFound)("The business application was not found.");
    return { application: serializeApplication(application), reviewHistory: application.reviews || [] };
  };

  history = async (applicationId) => {
    const exists = await _prisma.prisma.developerApplication.findUnique({ where: { id: applicationId }, select: { id: true } });
    if (!exists) throw (0, _errors.notFound)("The business application was not found.");
    return { applicationId, reviews: await _prisma.prisma.developerApplicationReview.findMany({ where: { applicationId }, orderBy: { createdAt: "desc" } }) };
  };

  decide = async ({ applicationId, action, reason = null, reviewer }) => {
    const transition = decisions[action];
    if (!transition) throw (0, _errors.badRequest)("The requested business decision is invalid.");
    const cleanReason = reason == null ? null : String(reason).trim();
    if (["REJECTED", "SUSPENDED"].includes(action) && (!cleanReason || cleanReason.length < 10)) throw (0, _errors.badRequest)("A reason of at least 10 characters is required for this decision.");
    if (!reviewer?.id || !reviewer?.email) throw (0, _errors.unauthorized)("Monitoring administrator identity is required.");

    return _prisma.prisma.$transaction(async (tx) => {
      const current = await tx.developerApplication.findUnique({ where: { id: applicationId }, include: { user: { select: userSelect } } });
      if (!current) throw (0, _errors.notFound)("The business application was not found.");
      if (current.status === "DELETED") throw (0, _errors.conflict)("Deleted business applications cannot be reviewed.");
      if (!transition.allowed.has(current.status)) throw (0, _errors.conflict)(`A ${current.status.toLowerCase()} business application cannot be ${action.toLowerCase()}.`);
      if (current.status === transition.status) return { application: serializeApplication({ ...current, apiKeys: [], reviews: [] }), changed: false };

      const updated = await tx.developerApplication.updateMany({ where: { id: applicationId, status: current.status }, data: { status: transition.status } });
      if (updated.count !== 1) throw (0, _errors.conflict)("The business application changed while it was being reviewed. Reload and try again.");
      if (transition.status === "ACTIVE") {
        await tx.apiKey.updateMany({ where: { applicationId, revokedAt: null }, data: { scopes: ["monitoring:read", "monitoring:write"] } });
      }
      await tx.developerApplicationReview.create({
        data: {
          applicationId,
          reviewerId: String(reviewer.id),
          reviewerEmail: String(reviewer.email),
          previousStatus: current.status,
          newStatus: transition.status,
          decision: action,
          reason: cleanReason
        }
      });
      const result = await tx.developerApplication.findUnique({ where: { id: applicationId }, include: applicationInclude });
      return { application: serializeApplication(result), changed: true };
    });
  };
}

exports.MerchantApprovalService = MerchantApprovalService;
const merchantApprovalService = exports.merchantApprovalService = new MerchantApprovalService();
