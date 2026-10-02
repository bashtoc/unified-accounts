"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateApiKey = generateApiKey;
exports.generateOtp = generateOtp;
exports.hashApiKey = hashApiKey;
exports.hashOtp = hashOtp;
exports.hashToken = hashToken;
exports.randomToken = randomToken;
exports.timingSafeEqual = timingSafeEqual;
exports.verifyMonitoringAdminAssertion = verifyMonitoringAdminAssertion;
var _crypto = _interopRequireDefault(require("crypto"));
var _env = require("../config/env");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function generateOtp() {
  return _crypto.default.randomInt(0, 1_000_000).toString().padStart(6, '0');
}
function hashOtp(phoneNumber, purpose, code) {
  return _crypto.default.createHmac('sha256', _env.env.OTP_PEPPER).update(`${phoneNumber}:${purpose}:${code}`).digest('hex');
}
function randomToken(bytes = 48) {
  return _crypto.default.randomBytes(bytes).toString('base64url');
}
function hashToken(token) {
  return _crypto.default.createHash('sha256').update(token).digest('hex');
}
function generateApiKey() {
  const body = _crypto.default.randomBytes(30).toString('base64url');
  const apiKey = `su_live_${body}`;
  return {
    apiKey,
    prefix: apiKey.slice(0, 15),
    hash: _crypto.default.createHmac('sha256', _env.env.API_KEY_PEPPER).update(apiKey).digest('hex')
  };
}
function hashApiKey(apiKey) {
  return _crypto.default.createHmac('sha256', _env.env.API_KEY_PEPPER).update(apiKey).digest('hex');
}
function timingSafeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && _crypto.default.timingSafeEqual(a, b);
}
function verifyMonitoringAdminAssertion(assertion, secret, method, path) {
  const [encodedPayload, signature] = String(assertion || "").split(".");
  if (!encodedPayload || !signature || !secret) return null;
  const expected = _crypto.default.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  if (!timingSafeEqual(expected, signature)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || typeof payload.sub !== 'string' || typeof payload.email !== 'string' || typeof payload.jti !== 'string' || typeof payload.iat !== 'number' || typeof payload.exp !== 'number' || payload.iat > now + 30 || payload.exp <= now || payload.exp > payload.iat + 120 || payload.method !== method || payload.path !== path) return null;
  return { id: payload.sub, email: payload.email.toLowerCase(), issuedAt: payload.iat, expiresAt: payload.exp, idempotencyKey: payload.jti };
}
