"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generalLimiter = exports.developerLimiter = exports.authLimiter = void 0;
var _expressRateLimit = _interopRequireDefault(require("express-rate-limit"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const standardHandler = (_req, res) => res.status(429).json({
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.'
  }
});
const generalLimiter = exports.generalLimiter = (0, _expressRateLimit.default)({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler
});
const authLimiter = exports.authLimiter = (0, _expressRateLimit.default)({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler
});
const developerLimiter = exports.developerLimiter = (0, _expressRateLimit.default)({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.header('x-api-key') ?? req.ip ?? 'unknown',
  handler: standardHandler
});
