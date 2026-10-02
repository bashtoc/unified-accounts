"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.refreshExpiry = refreshExpiry;
exports.monitoringAdminRefreshExpiry = monitoringAdminRefreshExpiry;
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.signMonitoringAdminAccessToken = signMonitoringAdminAccessToken;
exports.verifyMonitoringAdminAccessToken = verifyMonitoringAdminAccessToken;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _env = require("../config/env");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function signAccessToken(payload) {
  return _jsonwebtoken.default.sign(payload, _env.env.JWT_ACCESS_SECRET, {
    expiresIn: _env.env.ACCESS_TOKEN_TTL
  });
}
function verifyAccessToken(token) {
  return _jsonwebtoken.default.verify(token, _env.env.JWT_ACCESS_SECRET);
}
function signMonitoringAdminAccessToken(payload) {
  return _jsonwebtoken.default.sign({ ...payload, type: 'monitoring_admin' }, _env.env.JWT_ACCESS_SECRET, {
    expiresIn: _env.env.ACCESS_TOKEN_TTL,
    issuer: 'safer-signal-monitoring-admin',
    audience: 'safer-signal-monitoring-admin'
  });
}
function verifyMonitoringAdminAccessToken(token) {
  const payload = _jsonwebtoken.default.verify(token, _env.env.JWT_ACCESS_SECRET, {
    issuer: 'safer-signal-monitoring-admin',
    audience: 'safer-signal-monitoring-admin'
  });
  if (payload?.type !== 'monitoring_admin') throw new Error('Invalid monitoring administrator token.');
  return payload;
}
function refreshExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + _env.env.REFRESH_TOKEN_TTL_DAYS);
  return date;
}
function monitoringAdminRefreshExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + _env.env.MONITORING_ADMIN_REFRESH_TOKEN_TTL_DAYS);
  return date;
}
