"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitoringAdminAuthController = exports.MonitoringAdminAuthController = void 0;
var _service = require("../services/monitoringAdminAuthService");
var _response = require("../utils/response");

class MonitoringAdminAuthController {
  requestOtp = async (req, res, next) => {
    try { return (0, _response.ok)(res, await _service.monitoringAdminAuthService.requestOtp(req.body.email)); } catch (error) { next(error); }
  };
  verifyOtp = async (req, res, next) => {
    try { return (0, _response.ok)(res, await _service.monitoringAdminAuthService.verifyOtp(req.body.email, req.body.otp)); } catch (error) { next(error); }
  };
  refresh = async (req, res, next) => {
    try { return (0, _response.ok)(res, await _service.monitoringAdminAuthService.refresh(req.body.refreshToken)); } catch (error) { next(error); }
  };
  logout = async (req, res, next) => {
    try { return (0, _response.ok)(res, await _service.monitoringAdminAuthService.logout(req.body.refreshToken)); } catch (error) { next(error); }
  };
  me = async (req, res, next) => {
    try { return (0, _response.ok)(res, await _service.monitoringAdminAuthService.getCurrent(req.monitoringAdmin.id)); } catch (error) { next(error); }
  };
}

exports.MonitoringAdminAuthController = MonitoringAdminAuthController;
const monitoringAdminAuthController = exports.monitoringAdminAuthController = new MonitoringAdminAuthController();
