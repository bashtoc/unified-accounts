"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.businessRoutes = void 0;
var _express = require("express");
var _monitoringBusinessController = require("../controllers/monitoringBusinessController");
var _auth = require("../middleware/auth");
var _bankController = require("../controllers/bankController");
var _validate = require("../middleware/validate");
var _schemas = require("../validators/schemas");
var _rateLimit = require("../middleware/rateLimit");

const businessRoutes = exports.businessRoutes = (0, _express.Router)();
businessRoutes.post('/business/register', _rateLimit.authLimiter, (0, _validate.validate)(_schemas.businessSchemas.register), _monitoringBusinessController.monitoringBusinessController.register);
businessRoutes.post('/business/login', _rateLimit.authLimiter, (0, _validate.validate)(_schemas.businessSchemas.login), _monitoringBusinessController.monitoringBusinessController.login);
businessRoutes.post('/business/verify-otp', _rateLimit.authLimiter, (0, _validate.validate)(_schemas.businessSchemas.verifyOtp), _monitoringBusinessController.monitoringBusinessController.verifyOtp);
businessRoutes.post('/business/refresh', _rateLimit.authLimiter, (0, _validate.validate)(_schemas.businessSchemas.refresh), _monitoringBusinessController.monitoringBusinessController.refresh);
businessRoutes.get('/business/credentials', _auth.requireBusinessAuth, _monitoringBusinessController.monitoringBusinessController.getCredentials);
businessRoutes.post('/business/credentials/rotate', _auth.requireBusinessAuth, _monitoringBusinessController.monitoringBusinessController.rotateCredentials);
businessRoutes.get('/business/banks/status', _auth.requireBusinessAuth, _bankController.bankController.getStatus);
