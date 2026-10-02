"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitoringAdminAuthService = exports.MonitoringAdminAuthService = void 0;

var _prisma = require("../config/prisma");
var _env = require("../config/env");
var _errors = require("../utils/errors");
var _crypto = require("../utils/crypto");
var _tokens = require("../utils/tokens");
var _emailService = require("./emailService");

const ADMIN_OTP_PURPOSE = "MONITORING_ADMIN_LOGIN";
const ADMIN_PERMISSIONS = {
  OWNER: ["merchant_applications.read", "merchant_applications.manage"],
  REVIEWER: ["merchant_applications.read", "merchant_applications.manage"],
  READ_ONLY: ["merchant_applications.read"]
};

const adminSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  permissions: true,
  status: true,
  lastLoginAt: true,
  createdAt: true
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function serializeAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    status: admin.status,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt
  };
}

async function issueOtp(admin) {
  const code = (0, _crypto.generateOtp)();
  await _prisma.prisma.monitoringAdminOtp.create({
    data: {
      adminId: admin.id,
      codeHash: (0, _crypto.hashOtp)(admin.email, ADMIN_OTP_PURPOSE, code),
      expiresAt: new Date(Date.now() + _env.env.OTP_TTL_MINUTES * 60_000)
    }
  });
  await (0, _emailService.sendOtpEmail)({
    to: admin.email,
    code,
    expiresInMinutes: _env.env.OTP_TTL_MINUTES
  });
}

async function consumeOtp(admin, code) {
  const record = await _prisma.prisma.monitoringAdminOtp.findFirst({
    where: { adminId: admin.id, consumedAt: null },
    orderBy: { createdAt: "desc" }
  });
  if (!record || record.expiresAt <= new Date()) throw (0, _errors.unauthorized)("The code is invalid or expired.");
  if (record.attempts >= 5) throw (0, _errors.businessRule)("Too many invalid code attempts.");
  const expected = (0, _crypto.hashOtp)(admin.email, ADMIN_OTP_PURPOSE, code);
  if (!(0, _crypto.timingSafeEqual)(record.codeHash, expected)) {
    await _prisma.prisma.monitoringAdminOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw (0, _errors.unauthorized)("The code is invalid or expired.");
  }
  await _prisma.prisma.monitoringAdminOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
}

async function issueSession(admin, db = _prisma.prisma) {
  const refreshToken = (0, _crypto.randomToken)();
  await db.monitoringAdminRefreshToken.create({
    data: {
      adminId: admin.id,
      tokenHash: (0, _crypto.hashToken)(refreshToken),
      expiresAt: (0, _tokens.monitoringAdminRefreshExpiry)()
    }
  });
  return {
    accessToken: (0, _tokens.signMonitoringAdminAccessToken)({
      sub: admin.id,
      email: admin.email,
      role: admin.role
    }),
    refreshToken,
    admin: serializeAdmin(admin)
  };
}

class MonitoringAdminAuthService {
  async requestOtp(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw (0, _errors.badRequest)("Administrator email is required.");
    const admin = await _prisma.prisma.monitoringAdmin.findUnique({ where: { email: normalizedEmail } });
    if (admin && admin.status === "ACTIVE") await issueOtp(admin);
    return { message: "If this email is an authorized Signal operator, a verification code has been sent." };
  }

  async verifyOtp(email, code) {
    const normalizedEmail = normalizeEmail(email);
    const admin = await _prisma.prisma.monitoringAdmin.findUnique({ where: { email: normalizedEmail } });
    if (!admin || admin.status !== "ACTIVE") throw (0, _errors.unauthorized)("The code is invalid or expired.");
    await consumeOtp(admin, String(code || ""));
    const updatedAdmin = await _prisma.prisma.monitoringAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
      select: adminSelect
    });
    return issueSession(updatedAdmin);
  }

  async refresh(refreshToken) {
    const tokenHash = (0, _crypto.hashToken)(String(refreshToken || ""));
    const stored = await _prisma.prisma.monitoringAdminRefreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { admin: { select: adminSelect } }
    });
    if (!stored || stored.admin.status !== "ACTIVE") throw (0, _errors.unauthorized)("Monitoring admin session expired. Please sign in again.");
    return _prisma.prisma.$transaction(async tx => {
      const revoked = await tx.monitoringAdminRefreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      if (revoked.count !== 1) throw (0, _errors.unauthorized)("Monitoring admin session expired. Please sign in again.");
      return issueSession(stored.admin, tx);
    });
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await _prisma.prisma.monitoringAdminRefreshToken.updateMany({
        where: { tokenHash: (0, _crypto.hashToken)(String(refreshToken)), revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
    return { message: "Signed out." };
  }

  async getCurrent(adminId) {
    const admin = await _prisma.prisma.monitoringAdmin.findUnique({ where: { id: adminId }, select: adminSelect });
    if (!admin || admin.status !== "ACTIVE") throw (0, _errors.unauthorized)("Monitoring admin session expired. Please sign in again.");
    return { admin: serializeAdmin(admin) };
  }
}

exports.MonitoringAdminAuthService = MonitoringAdminAuthService;
const monitoringAdminAuthService = exports.monitoringAdminAuthService = new MonitoringAdminAuthService();
