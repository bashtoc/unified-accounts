"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.env = exports.corsOrigins = void 0;
var _dotenv = _interopRequireDefault(require("dotenv"));
var _zod = require("zod");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
_dotenv.default.config();
const envSchema = _zod.z.object({
  NODE_ENV: _zod.z.enum(['development', 'test', 'production']).default('development'),
  PORT: _zod.z.coerce.number().int().positive().default(4000),
  DATABASE_URL: _zod.z.string().min(1),
  JWT_ACCESS_SECRET: _zod.z.string().min(24),
  JWT_REFRESH_SECRET: _zod.z.string().min(24),
  ACCESS_TOKEN_TTL: _zod.z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: _zod.z.coerce.number().int().positive().default(30),
  MONITORING_ADMIN_REFRESH_TOKEN_TTL_DAYS: _zod.z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: _zod.z.string().default('http://localhost:5173'),
  OTP_TTL_MINUTES: _zod.z.coerce.number().int().positive().default(10),
  OTP_PEPPER: _zod.z.string().min(12),
  API_KEY_PEPPER: _zod.z.string().min(12),
  MONITORING_ADMIN_BOOTSTRAP_EMAIL: _zod.z.string().email().optional(),
  MONITORING_ADMIN_BOOTSTRAP_NAME: _zod.z.string().min(2).max(120).optional(),
  MONITORING_ADMIN_BOOTSTRAP_ROLE: _zod.z.enum(['OWNER', 'REVIEWER', 'READ_ONLY']).optional(),
  // Cloudflare Email
  CF_ACCOUNT_ID: _zod.z.string().optional(),
  CF_API_TOKEN: _zod.z.string().optional(),
  MAIL_FROM_EMAIL: _zod.z.string().optional()
});
const env = exports.env = {
  ...envSchema.parse(process.env),
  get cloudflareAccountId() {
    return this.CF_ACCOUNT_ID;
  },
  get cloudflareApiToken() {
    return this.CF_API_TOKEN;
  },
  get mailFromEmail() {
    return this.MAIL_FROM_EMAIL;
  }
};
const corsOrigins = exports.corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
