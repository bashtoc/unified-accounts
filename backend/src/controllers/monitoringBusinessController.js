"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitoringBusinessController = exports.MonitoringBusinessController = void 0;
var _prisma = require("../config/prisma");
var _crypto = require("../utils/crypto");
var _response = require("../utils/response");
var _errors = require("../utils/errors");
var _monitoringAuthService = require("../services/monitoringAuthService");

class MonitoringBusinessController {
  register = async (req, res, next) => {
    try {
      const name = req.body.name.trim();
      const email = req.body.email.trim().toLowerCase();
      const websiteUrl = req.body.websiteUrl.trim();
      const existingUser = await _prisma.prisma.user.findFirst({
        where: { OR: [{ email }, { phoneNumber: email }] },
        select: { id: true }
      });
      if (existingUser) throw (0, _errors.conflict)("A monitoring workspace already exists for this email.");

      const generatedKey = (0, _crypto.generateApiKey)();
      const application = await _prisma.prisma.$transaction(async tx => {
        const user = await tx.user.create({
          data: {
            fullName: name,
            email,
            phoneNumber: email,
            passwordHash: "otp-only-monitoring"
          }
        });
        const app = await tx.developerApplication.create({
          data: {
            userId: user.id,
            name,
            websiteUrl,
            status: "INACTIVE"
          }
        });
        await tx.apiKey.create({
          data: {
            applicationId: app.id,
            keyPrefix: generatedKey.prefix,
            keyHash: generatedKey.hash,
            scopes: ["monitoring:read"]
          }
        });
        return app;
      });

      await _monitoringAuthService.monitoringAuthService.requestBusinessOtp(email);
      return (0, _response.created)(res, {
        message: "Monitoring workspace created. OTP sent to business email.",
        status: application.status,
        applicationId: application.id,
        apiKey: generatedKey.apiKey,
        clientId: generatedKey.prefix,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const result = await _monitoringAuthService.monitoringAuthService.requestBusinessOtp(req.body.email.trim().toLowerCase());
      return (0, _response.ok)(res, result);
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req, res, next) => {
    try {
      const result = await _monitoringAuthService.monitoringAuthService.verifyBusinessOtp(req.body.email.trim().toLowerCase(), req.body.otp);
      return (0, _response.ok)(res, { ...result, secretKey: result.accessToken });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const result = await _monitoringAuthService.monitoringAuthService.refreshBusinessSession(req.body.refreshToken);
      return (0, _response.ok)(res, { ...result, secretKey: result.accessToken });
    } catch (error) {
      next(error);
    }
  };

  getCredentials = async (req, res, next) => {
    try {
      const keys = await _prisma.prisma.apiKey.findMany({
        where: { applicationId: req.application.id },
        select: {
          id: true,
          keyPrefix: true,
          scopes: true,
          lastUsedAt: true,
          expiresAt: true,
          revokedAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      });
      return (0, _response.ok)(res, { applicationId: req.application.id, keys });
    } catch (error) {
      next(error);
    }
  };

  rotateCredentials = async (req, res, next) => {
    try {
      if (req.application.status !== "ACTIVE") throw (0, _errors.forbidden)("The merchant account must be active before credentials can be rotated.");
      const generatedKey = (0, _crypto.generateApiKey)();
      await _prisma.prisma.$transaction([
        _prisma.prisma.apiKey.updateMany({
          where: { applicationId: req.application.id, revokedAt: null },
          data: { revokedAt: new Date() }
        }),
        _prisma.prisma.apiKey.create({
          data: {
            applicationId: req.application.id,
            keyPrefix: generatedKey.prefix,
            keyHash: generatedKey.hash,
            scopes: ["monitoring:read", "monitoring:write"]
          }
        })
      ]);
      return (0, _response.created)(res, {
        applicationId: req.application.id,
        clientId: generatedKey.prefix,
        apiKey: generatedKey.apiKey,
        scopes: ["monitoring:read", "monitoring:write"]
      });
    } catch (error) {
      next(error);
    }
  };

  getApiAccount = async (req, res, next) => {
    try {
      const scopes = Array.isArray(req.apiKeyScopes) ? req.apiKeyScopes : [];
      const isActive = req.application.status === "ACTIVE";
      const canReadBankStatus = isActive && scopes.includes("monitoring:read");
      const canContributeBankStatus = isActive && scopes.includes("monitoring:write");
      const eligibilityReason = req.application.status === "INACTIVE"
        ? "Merchant account is pending manual activation."
        : req.application.status !== "ACTIVE"
          ? "Merchant account is not active."
          : "Merchant account is active and verified.";

      return (0, _response.ok)(res, {
        merchant: {
          applicationId: req.application.id,
          name: req.application.name,
          email: req.application.user?.email || null,
          websiteUrl: req.application.websiteUrl,
          status: req.application.status,
          createdAt: req.application.createdAt,
          updatedAt: req.application.updatedAt
        },
        apiKey: {
          keyPrefix: req.apiKey.keyPrefix,
          scopes,
          lastUsedAt: req.apiKey.lastUsedAt,
          expiresAt: req.apiKey.expiresAt,
          revokedAt: req.apiKey.revokedAt
        },
        eligibility: {
          verified: isActive,
          canReadBankStatus,
          canContributeBankStatus,
          reason: eligibilityReason
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

exports.MonitoringBusinessController = MonitoringBusinessController;
const monitoringBusinessController = exports.monitoringBusinessController = new MonitoringBusinessController();
