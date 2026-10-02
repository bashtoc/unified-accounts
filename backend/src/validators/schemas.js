"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitoringSchemas = exports.monitoringAdminSchemas = exports.monitoringAdminAuthSchemas = exports.bankSchemas = exports.businessSchemas = void 0;
var _zod = require("zod");

const email = _zod.z.string().trim().email().max(254);
const websiteUrl = _zod.z.string().trim().url("Website URL must be a valid URL.").max(2048).refine(value => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Website URL must use http or https.");
const bankCode = _zod.z.string().trim().min(1).max(20);
const transactionStatus = _zod.z.enum(["SUCCESS", "FAILED", "PENDING", "REVERSED"]);
const failureCategory = _zod.z.enum([
  "BANK_UNAVAILABLE",
  "BANK_TIMEOUT",
  "NETWORK_ERROR",
  "INSUFFICIENT_FUNDS",
  "INVALID_ACCOUNT",
  "USER_CANCELLED",
  "BUSINESS_RULE",
  "UNKNOWN"
]);

const businessSchemas = exports.businessSchemas = {
  register: _zod.z.object({
    body: _zod.z.object({
      name: _zod.z.string().trim().min(2).max(120),
      email,
      websiteUrl
    }).strict()
  }),
  login: _zod.z.object({
    body: _zod.z.object({ email }).strict()
  }),
  verifyOtp: _zod.z.object({
    body: _zod.z.object({
      email,
      otp: _zod.z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits.")
    }).strict()
  }),
  refresh: _zod.z.object({
    body: _zod.z.object({
      refreshToken: _zod.z.string().trim().min(32).max(512)
    }).strict()
  })
};

const bankSchemas = exports.bankSchemas = {
  bankId: _zod.z.object({
    params: _zod.z.object({
      bankId: _zod.z.coerce.number().int().positive()
    })
  })
};

const monitoringSchemas = exports.monitoringSchemas = {
  transactionStatus: _zod.z.object({
    body: _zod.z.object({
      bankCode,
      transactionId: _zod.z.string().trim().min(1).max(128),
      status: transactionStatus,
      failureCategory: failureCategory.optional(),
      latencyMs: _zod.z.coerce.number().int().min(0).max(120000).optional(),
      source: _zod.z.string().trim().min(1).max(40).default("business-api")
    }).strict().superRefine((data, ctx) => {
      if (data.status === "FAILED" && !data.failureCategory) {
        ctx.addIssue({
          code: _zod.z.ZodIssueCode.custom,
          path: ["failureCategory"],
          message: "failureCategory is required when status is FAILED."
        });
      }
    })
  })
};

const applicationId = _zod.z.object({ applicationId: _zod.z.string().uuid() });
const decision = _zod.z.object({
  body: _zod.z.object({ reason: _zod.z.string().trim().max(2000).optional() }).strict(),
  params: applicationId
});
const decisionWithRequiredReason = _zod.z.object({
  body: _zod.z.object({ reason: _zod.z.string().trim().min(10).max(2000) }).strict(),
  params: applicationId
});
const monitoringAdminSchemas = exports.monitoringAdminSchemas = {
  list: _zod.z.object({
    query: _zod.z.object({
      status: _zod.z.enum(["INACTIVE", "ACTIVE", "REJECTED", "SUSPENDED", "DELETED", "all"]).default("INACTIVE"),
      search: _zod.z.string().trim().max(120).default(""),
      limit: _zod.z.coerce.number().int().min(1).max(100).default(25),
      offset: _zod.z.coerce.number().int().min(0).default(0)
    })
  }),
  detail: _zod.z.object({ params: applicationId }),
  decision,
  decisionWithRequiredReason
};

const monitoringAdminAuthSchemas = exports.monitoringAdminAuthSchemas = {
  requestOtp: _zod.z.object({
    body: _zod.z.object({ email }).strict()
  }),
  verifyOtp: _zod.z.object({
    body: _zod.z.object({
      email,
      otp: _zod.z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits.")
    }).strict()
  }),
  refresh: _zod.z.object({
    body: _zod.z.object({
      refreshToken: _zod.z.string().trim().min(32).max(512)
    }).strict()
  })
};
