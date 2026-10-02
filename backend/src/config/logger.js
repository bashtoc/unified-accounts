"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = void 0;
var _pino = _interopRequireDefault(require("pino"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const redact = ['req.headers.authorization', 'req.body.password', 'req.body.otp', 'req.body.code', 'req.body.refreshToken', 'req.body.apiKey', 'res.body.data.apiKey'];
const logger = exports.logger = (0, _pino.default)({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: redact,
    censor: '[REDACTED]'
  }
});