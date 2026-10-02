"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bankRoutes = void 0;
var _express = require("express");
var _bankController = require("../controllers/bankController");
var _monitoringBusinessController = require("../controllers/monitoringBusinessController");
var _validate = require("../middleware/validate");
var _schemas = require("../validators/schemas");
var _auth = require("../middleware/auth");
var _rateLimit = require("../middleware/rateLimit");
const bankRoutes = exports.bankRoutes = (0, _express.Router)();
bankRoutes.get('/bank-logos/generated/:bankCode.svg', _bankController.bankController.getGeneratedLogo);
bankRoutes.get('/banks/status', _bankController.bankController.getStatus);
bankRoutes.get('/banks', _bankController.bankController.list);
bankRoutes.post('/banks/transaction-status', _rateLimit.developerLimiter, _auth.requireApiKey, (0, _auth.requireScopes)(['monitoring:write']), (0, _validate.validate)(_schemas.monitoringSchemas.transactionStatus), _bankController.bankController.transactionStatus);
bankRoutes.get('/merchant/account', _auth.requireApiKeyForAccount, _monitoringBusinessController.monitoringBusinessController.getApiAccount);
bankRoutes.get('/merchant/banks/status', _auth.requireApiKey, (0, _auth.requireScopes)(['monitoring:read']), _bankController.bankController.getStatus);
bankRoutes.get('/banks/:bankId', (0, _validate.validate)(_schemas.bankSchemas.bankId), _bankController.bankController.get);
bankRoutes.get('/banks/:bankId/events', (0, _validate.validate)(_schemas.bankSchemas.bankId), _bankController.bankController.history);
