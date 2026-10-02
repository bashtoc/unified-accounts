"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apiRoutes = void 0;
var _express = require("express");
var _bankRoutes = require("./bankRoutes");
var _businessRoutes = require("./businessRoutes");
var _monitoringAdminAuthRoutes = require("./monitoringAdminAuthRoutes");
var _monitoringAdminRoutes = require("./monitoringAdminRoutes");
const apiRoutes = exports.apiRoutes = (0, _express.Router)();
apiRoutes.use(_bankRoutes.bankRoutes);
apiRoutes.use(_businessRoutes.businessRoutes);
apiRoutes.use(_monitoringAdminAuthRoutes.monitoringAdminAuthRoutes);
apiRoutes.use(_monitoringAdminRoutes.monitoringAdminRoutes);
