"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitoringAdminAuthRoutes = void 0;
var _express = require("express");
var _auth = require("../middleware/auth");
var _controller = require("../controllers/monitoringAdminAuthController");
var _validate = require("../middleware/validate");
var _schemas = require("../validators/schemas");
var _rateLimit = require("../middleware/rateLimit");

const monitoringAdminAuthRoutes = exports.monitoringAdminAuthRoutes = (0, _express.Router)();
monitoringAdminAuthRoutes.post("/admin/auth/request-otp", _rateLimit.authLimiter, (0, _validate.validate)(_schemas.monitoringAdminAuthSchemas.requestOtp), _controller.monitoringAdminAuthController.requestOtp);
monitoringAdminAuthRoutes.post("/admin/auth/verify-otp", _rateLimit.authLimiter, (0, _validate.validate)(_schemas.monitoringAdminAuthSchemas.verifyOtp), _controller.monitoringAdminAuthController.verifyOtp);
monitoringAdminAuthRoutes.post("/admin/auth/refresh", _rateLimit.authLimiter, (0, _validate.validate)(_schemas.monitoringAdminAuthSchemas.refresh), _controller.monitoringAdminAuthController.refresh);
monitoringAdminAuthRoutes.post("/admin/auth/logout", _rateLimit.authLimiter, (0, _validate.validate)(_schemas.monitoringAdminAuthSchemas.refresh), _controller.monitoringAdminAuthController.logout);
monitoringAdminAuthRoutes.get("/admin/auth/me", _auth.requireMonitoringAdmin, _controller.monitoringAdminAuthController.me);
