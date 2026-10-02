"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringAuthService = exports.MonitoringAuthService = void 0;

var _prisma = require("../config/prisma");
var _env = require("../config/env");
var _errors = require("../utils/errors");
var _crypto = require("../utils/crypto");
var _tokens = require("../utils/tokens");
var _emailService = require("./emailService");

async function issueOtp(email) {
  const otp = (0, _crypto.generateOtp)();
  await _prisma.prisma.otpCode.create({
    data: {
      phoneNumber: email,
      purpose: "LOGIN",
      codeHash: (0, _crypto.hashOtp)(email, "LOGIN", otp),
      expiresAt: new Date(Date.now() + _env.env.OTP_TTL_MINUTES * 60_000)
    }
  });
  await (0, _emailService.sendOtpEmail)({
    to: email,
    code: otp,
    expiresInMinutes: _env.env.OTP_TTL_MINUTES
  });
  return undefined;
}

async function consumeOtp(email, otp) {
  const record = await _prisma.prisma.otpCode.findFirst({
    where: { phoneNumber: email, purpose: "LOGIN", consumedAt: null },
    orderBy: { createdAt: "desc" }
  });
  if (!record || record.expiresAt <= new Date()) throw (0, _errors.unauthorized)("The code is invalid or expired.");
  if (record.attempts >= 5) throw (0, _errors.businessRule)("Too many invalid code attempts.");
  if (record.codeHash !== (0, _crypto.hashOtp)(email, "LOGIN", otp)) {
    await _prisma.prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw (0, _errors.unauthorized)("The code is invalid or expired.");
  }
  await _prisma.prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
}

async function issueSession(user, db = _prisma.prisma) {
  const refreshToken = (0, _crypto.randomToken)();
  await db.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: (0, _crypto.hashToken)(refreshToken),
      expiresAt: (0, _tokens.refreshExpiry)()
    }
  });
  return {
    accessToken: (0, _tokens.signAccessToken)({ sub: user.id, phoneNumber: user.phoneNumber }),
    refreshToken
  };
}

async function findBusinessApplication(userId, db = _prisma.prisma) {
  return db.developerApplication.findFirst({
    where: { userId, status: { in: ["ACTIVE", "INACTIVE"] } },
    include: {
      apiKeys: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
}

function buildBusinessSession(user, application, session) {
  const apiKey = application.apiKeys[0];
  return {
    message: "Login successful",
    clientId: apiKey?.keyPrefix,
    applicationId: application.id,
    name: application.name,
    websiteUrl: application.websiteUrl,
    status: application.status,
    canContributeBankStatus: application.status === "ACTIVE" && Array.isArray(apiKey?.scopes) && apiKey.scopes.includes("monitoring:write"),
    email: user.email || user.phoneNumber,
    ...session
  };
}

class MonitoringAuthService {
  async requestBusinessOtp(email) {
    if (!email) throw (0, _errors.badRequest)("Business email is required.");
    const user = await _prisma.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber: email }]
      },
      include: { applications: { select: { status: true } } }
    });
    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw (0, _errors.unauthorized)("Business account not found. Please register first.");
    }
    const application = user.applications.find(item => item.status === "ACTIVE" || item.status === "INACTIVE");
    if (!application) {
      throw (0, _errors.unauthorized)("Business account not found. Please register first.");
    }
    return { message: "OTP sent to business email", otp: await issueOtp(email) };
  }

  async verifyBusinessOtp(email, otp) {
    if (!email || !otp) throw (0, _errors.badRequest)("Business email and OTP are required.");
    await consumeOtp(email, otp);
    const user = await _prisma.prisma.user.findFirst({ where: { OR: [{ email }, { phoneNumber: email }] } });
    if (!user || user.deletedAt || user.status !== "ACTIVE") throw (0, _errors.unauthorized)("Business account not found.");
    const application = await findBusinessApplication(user.id);
    if (!application) throw (0, _errors.unauthorized)("No monitoring workspace found for this account.");
    return buildBusinessSession(user, application, await issueSession(user));
  }

  async refreshBusinessSession(refreshToken) {
    if (!refreshToken) throw (0, _errors.badRequest)("A refresh token is required.");

    const storedToken = await _prisma.prisma.refreshToken.findFirst({
      where: {
        tokenHash: (0, _crypto.hashToken)(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    const user = storedToken?.user;
    if (!storedToken || !user || user.deletedAt || user.status !== "ACTIVE") {
      throw (0, _errors.unauthorized)("Business session expired. Please sign in again.");
    }

    const application = await findBusinessApplication(user.id);
    if (!application) throw (0, _errors.unauthorized)("The monitoring workspace is no longer available.");

    const nextSession = await _prisma.prisma.$transaction(async tx => {
      const revoked = await tx.refreshToken.updateMany({
        where: { id: storedToken.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      if (revoked.count !== 1) throw (0, _errors.unauthorized)("Business session expired. Please sign in again.");
      return issueSession(user, tx);
    });

    return buildBusinessSession(user, application, nextSession);
  }
}

const monitoringAuthService = exports.monitoringAuthService = new MonitoringAuthService();
