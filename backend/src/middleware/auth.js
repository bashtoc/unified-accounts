"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireApiKey = requireApiKey;
exports.requireApiKeyForAccount = requireApiKeyForAccount;
exports.requireBusinessAuth = requireBusinessAuth;
exports.requireMonitoringAdmin = requireMonitoringAdmin;
exports.requireMonitoringAdminPermission = requireMonitoringAdminPermission;
exports.requireScopes = requireScopes;
var _prisma = require("../config/prisma");
var _errors = require("../utils/errors");
var _tokens = require("../utils/tokens");
var _crypto = require("../utils/crypto");

async function requireMonitoringAdmin(req, _res, next) {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) return next((0, _errors.unauthorized)("Monitoring administrator authentication required."));
  try {
    const payload = (0, _tokens.verifyMonitoringAdminAccessToken)(authHeader.slice("Bearer ".length));
    const admin = await _prisma.prisma.monitoringAdmin.findUnique({ where: { id: payload.sub } });
    if (!admin || admin.status !== "ACTIVE") throw (0, _errors.unauthorized)("Monitoring administrator account is inactive.");
    req.monitoringAdmin = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
      status: admin.status
    };
    next();
  } catch (error) {
    next(error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError" ? (0, _errors.unauthorized)("Invalid or expired monitoring administrator session.") : error);
  }
}

function requireMonitoringAdminPermission(permission) {
  return (req, _res, next) => {
    const admin = req.monitoringAdmin;
    if (admin?.role === "OWNER" || admin?.permissions?.includes(permission)) return next();
    return next((0, _errors.forbidden)("Your monitoring administrator role does not allow this action."));
  };
}

function requireScopes(scopes) {
  return (req, _res, next) => {
    const granted = req.apiKeyScopes ?? [];
    if (!scopes.every(scope => granted.includes(scope))) {
      return next((0, _errors.forbidden)("The API key lacks the required monitoring scope."));
    }
    next();
  };
}

async function authenticateApiKey(req, next, { allowInactive = false } = {}) {
  try {
    const rawKey = req.header("x-api-key");
    if (!rawKey) return next((0, _errors.unauthorized)("A valid monitoring API key is required."));
    const key = await _prisma.prisma.apiKey.findFirst({
      where: {
        keyHash: (0, _crypto.hashApiKey)(rawKey),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: { application: { include: { user: { select: { email: true } } } } }
    });
    const allowedApplicationStatus = key && (key.application.status === "ACTIVE" || allowInactive && key.application.status === "INACTIVE");
    if (!key || !allowedApplicationStatus) {
      return next((0, _errors.unauthorized)("A valid monitoring API key is required."));
    }
    await _prisma.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    req.apiKey = key;
    req.application = key.application;
    req.apiKeyScopes = Array.isArray(key.scopes) ? key.scopes : [];
    next();
  } catch (error) {
    next(error);
  }
}

async function requireApiKey(req, _res, next) {
  return authenticateApiKey(req, next);
}

async function requireApiKeyForAccount(req, _res, next) {
  return authenticateApiKey(req, next, { allowInactive: true });
}

async function requireBusinessAuth(req, _res, next) {
  const clientId = req.header("clientid");
  const authHeader = req.header("authorization");
  if (!clientId || !authHeader?.startsWith("Bearer ")) {
    return next((0, _errors.unauthorized)("ClientID and bearer access token are required."));
  }

  try {
    const payload = (0, _tokens.verifyAccessToken)(authHeader.slice("Bearer ".length));
    const user = await _prisma.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE" || user.deletedAt) throw (0, _errors.unauthorized)("Invalid business session.");
    const application = await _prisma.prisma.developerApplication.findFirst({
      where: {
        userId: user.id,
        status: { in: ["ACTIVE", "INACTIVE"] },
        apiKeys: {
          some: {
            keyPrefix: clientId,
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          }
        }
      },
      include: { user: true }
    });
    if (!application) throw (0, _errors.unauthorized)("The monitoring workspace or credential is no longer active.");
    req.user = { id: user.id, email: user.email, status: user.status };
    req.application = application;
    next();
  } catch (error) {
    next(error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError" ? (0, _errors.unauthorized)("Invalid or expired business session.") : error);
  }
}
