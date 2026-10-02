"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openApiDocument = void 0;

const bankStatusSchema = {
  type: "object",
  required: ["id", "name", "bankCode", "institutionType", "isNetworkSwitch", "status", "trustScore"],
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "Guaranty Trust Bank" },
    slug: { type: "string", example: "guaranty-trust-bank" },
    bankCode: {
      type: "string",
      description: "Provider transfer code for banks. The NIBSS network switch uses the stable identifier NIBSS and is not a transfer destination.",
      example: "058"
    },
    institutionType: { type: "string", enum: ["bank", "network_switch"], example: "bank" },
    isNetworkSwitch: { type: "boolean", example: false },
    longCode: { type: ["string", "null"], example: "058" },
    nipInstitutionCode: {
      type: ["string", "null"],
      description: "NIP institution identifier. Do not substitute it for bankCode unless your downstream NIP integration requires it.",
      example: "000005"
    },
    supportsTransfer: { type: "boolean", example: true },
    country: { type: "string", example: "Nigeria" },
    currency: { type: "string", example: "NGN" },
    bankType: { type: ["string", "null"], example: "commercial" },
    logoUrl: { type: "string", example: "/bank-logos/generated/058.svg" },
    featured: { type: "boolean", example: true },
    displayOrder: { type: "integer", example: 1 },
    status: { type: "string", enum: ["healthy", "degraded", "down", "unknown"], example: "healthy" },
    networkSignal: { type: ["string", "null"], enum: ["positive", "negative", null], description: "Present for NIBSS. Positive when fewer than five active banks are down; negative at five or more.", example: null },
    downBankCount: { type: ["integer", "null"], minimum: 0, description: "Present for NIBSS and derived from the current status of ordinary banks.", example: null },
    downThreshold: { type: ["integer", "null"], minimum: 1, description: "The number of down banks that makes the NIBSS signal negative.", example: null },
    trustScore: { type: "integer", minimum: 0, maximum: 100, example: 96 },
    successRate: { type: ["integer", "null"], minimum: 0, maximum: 100, example: 98 },
    latencyMs: { type: ["integer", "null"], minimum: 0, example: 185 },
    lastCheckedAt: { type: ["string", "null"], format: "date-time", example: "2026-08-14T10:30:00.000Z" },
    statusSource: { type: "string", example: "bank-integration" },
    updatedAt: { type: "string", format: "date-time", example: "2026-08-14T10:30:00.000Z" }
  }
};

const bankEventSchema = {
  type: "object",
  required: ["id", "bankId", "status", "trustScore", "source", "createdAt"],
  properties: {
    id: { type: "string", format: "uuid", example: "3e6f6c10-873d-48e9-a3b5-8a4f2cc12a48" },
    bankId: { type: "integer", example: 1 },
    transactionId: { type: ["string", "null"], example: "pmt_01J5Q5Q2T8" },
    status: { type: "string", enum: ["healthy", "degraded", "down", "unknown"], example: "healthy" },
    trustScore: { type: "integer", minimum: 0, maximum: 100, example: 96 },
    latencyMs: { type: ["integer", "null"], minimum: 0, example: 185 },
    source: { type: "string", example: "bank-integration" },
    details: {
      type: ["object", "null"],
      properties: {
        success: { type: ["boolean", "null"], example: true },
        transactionId: { type: ["string", "null"], example: "pmt_01J5Q5Q2T8" },
        transactionStatus: { type: ["string", "null"], example: "SUCCESS" },
        failureCategory: { type: ["string", "null"], example: null },
        countsAgainstUptime: { type: "boolean", example: true },
        impact: { type: "string", enum: ["positive", "negative", "neutral"], example: "positive" },
        reason: { type: "string", example: "transaction_success" },
        duplicate: { type: "boolean", example: false },
        downBankCount: { type: ["integer", "null"], minimum: 0, example: null },
        downThreshold: { type: ["integer", "null"], minimum: 1, example: null },
        downBanks: { type: "array", items: { type: "string" }, example: [] }
      }
    },
    createdAt: { type: "string", format: "date-time", example: "2026-08-14T10:30:00.000Z" }
  }
};

const errorSchema = {
  type: "object",
  required: ["success", "error", "requestId"],
  properties: {
    success: { type: "boolean", example: false },
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string", example: "VALIDATION_ERROR" },
        message: { type: "string", example: "The submitted data is invalid." },
        fields: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } }
      }
    },
    requestId: { type: "string", example: "req_01J5Q5Q2T8" }
  }
};

const jsonResponse = (description, data, example) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["success", "data", "meta"],
        properties: {
          success: { type: "boolean", example: true },
          data,
          meta: { type: "object", additionalProperties: true, example: {} }
        }
      },
      ...(example ? { example: { success: true, data: example, meta: {} } } : {})
    }
  }
});

const errorResponses = {
  "400": { $ref: "#/components/responses/ValidationError" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "404": { $ref: "#/components/responses/NotFound" },
  "409": { $ref: "#/components/responses/Conflict" },
  "429": { $ref: "#/components/responses/RateLimited" },
  "500": { $ref: "#/components/responses/ServerError" }
};

const monitoringAdminDecisionOperation = (summary, description) => ({
  post: {
    tags: ["Signal administration"],
    summary,
    description,
    operationId: summary.replace(/[^a-zA-Z0-9]+/g, ""),
    security: [{ monitoringAdminBearer: [] }],
    parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: { required: false, content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string", maxLength: 2000 } } } } } },
    responses: { "200": jsonResponse("Updated business application.", { type: "object", properties: { application: { type: "object" }, changed: { type: "boolean" } } }), ...errorResponses }
  }
});

const openApiDocument = exports.openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Safer Signal Monitoring API",
    version: "1.1.1",
    description: "A read-only bank network intelligence API plus authenticated merchant telemetry ingestion. Safer Signal reports bank availability, latency, trust, and event history; it does not hold, route, settle, or transfer money.",
    contact: { name: "Safer Signal API support", url: "https://signal.saference.com" }
  },
  servers: [
    { url: "https://signal.saference.com/api/v1", description: "Production" }
  ],
  tags: [
    { name: "Public monitoring", description: "Unauthenticated, read-only endpoints for current bank network intelligence." },
    { name: "Merchant API", description: "API-key protected endpoints for merchant eligibility and current bank status." },
    { name: "Monitoring ingestion", description: "API-key protected transaction outcomes used to update bank trust and uptime signals." },
    { name: "Business console", description: "OTP login and workspace administration endpoints used by the Safer Signal console." },
    { name: "Signal administration", description: "Pre-provisioned Signal operator authentication and auditable merchant approval workflows." }
  ],
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "Server-side merchant API key. Never expose this key in browser or mobile client code."
      },
      businessBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Short-lived OTP-issued business access token. Access tokens are valid for 15 minutes; use POST /business/refresh with the refresh token to continue a session without another OTP."
      },
    clientId: {
      type: "apiKey",
      in: "header",
      name: "ClientID",
      description: "The active API key prefix returned by business OTP verification."
      },
      monitoringAdminBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Short-lived Signal operator access token issued by the native monitoring administrator OTP flow. Refresh with the administrator refresh endpoint."
      }
    },
    schemas: {
      BankStatus: bankStatusSchema,
      BankEvent: bankEventSchema,
      Error: errorSchema,
      TransactionStatus: {
        type: "object",
        required: ["bankCode", "transactionId", "status"],
        additionalProperties: false,
        properties: {
          bankCode: {
            type: "string",
            minLength: 1,
            maxLength: 20,
            description: "Provider transfer code for an ordinary bank. For Paystack, use the bank object's code, not its NIP institution code. NIBSS is derived and cannot be submitted directly.",
            example: "058"
          },
          transactionId: {
            type: "string",
            minLength: 1,
            maxLength: 128,
            description: "Your idempotency key for the payment attempt. Re-sending the same bankCode and transactionId is safe.",
            example: "pmt_01J5Q5Q2T8"
          },
          status: { type: "string", enum: ["SUCCESS", "FAILED", "PENDING", "REVERSED"], example: "SUCCESS" },
          failureCategory: {
            type: "string",
            enum: ["BANK_UNAVAILABLE", "BANK_TIMEOUT", "NETWORK_ERROR", "INSUFFICIENT_FUNDS", "INVALID_ACCOUNT", "USER_CANCELLED", "BUSINESS_RULE", "UNKNOWN"],
            description: "Required when status is FAILED. Only BANK_UNAVAILABLE, BANK_TIMEOUT, and NETWORK_ERROR reduce the bank uptime signal."
          },
          latencyMs: { type: "integer", minimum: 0, maximum: 120000, description: "Measured end-to-end provider response time in milliseconds.", example: 240 },
          source: { type: "string", minLength: 1, maxLength: 40, default: "business-api", description: "Your telemetry source label.", example: "paystack-production" }
        }
      },
      TransactionSignal: {
        type: "object",
        properties: {
          transactionId: { type: "string", example: "pmt_01J5Q5Q2T8" },
          transactionStatus: { type: "string", example: "SUCCESS" },
          failureCategory: { type: ["string", "null"], example: null },
          countsAgainstUptime: { type: "boolean", example: true },
          success: { type: ["boolean", "null"], example: true },
          impact: { type: "string", enum: ["positive", "negative", "neutral"], example: "positive" },
          reason: { type: "string", example: "transaction_success" },
          duplicate: { type: "boolean", example: false }
        }
      },
      BusinessRegistration: {
        type: "object",
        required: ["name", "email", "websiteUrl"],
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120, example: "Acme Payments" },
          email: { type: "string", format: "email", maxLength: 254, example: "ops@acme.com" },
          websiteUrl: { type: "string", format: "uri", description: "Public business website using http or https.", example: "https://acme.com" }
        }
      },
      BusinessEmail: {
        type: "object",
        required: ["email"],
        additionalProperties: false,
        properties: { email: { type: "string", format: "email", maxLength: 254, example: "ops@acme.com" } }
      },
      VerifyOtp: {
        type: "object",
        required: ["email", "otp"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "ops@acme.com" },
          otp: { type: "string", pattern: "^[0-9]{6}$", example: "123456" }
        }
      },
      RefreshSession: {
        type: "object",
        required: ["refreshToken"],
        additionalProperties: false,
        properties: {
          refreshToken: { type: "string", minLength: 32, maxLength: 512, writeOnly: true, description: "The refresh token returned by OTP verification. Refresh tokens are valid for 30 days and are rotated after every successful refresh." }
        }
      },
      MonitoringAdminEmail: {
        type: "object",
        required: ["email"],
        additionalProperties: false,
        properties: { email: { type: "string", format: "email", maxLength: 254, example: "operator@saference.com" } }
      },
      MonitoringAdminVerifyOtp: {
        type: "object",
        required: ["email", "otp"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "operator@saference.com" },
          otp: { type: "string", pattern: "^[0-9]{6}$", example: "123456" }
        }
      },
      MonitoringAdminRefreshSession: {
        type: "object",
        required: ["refreshToken"],
        additionalProperties: false,
        properties: { refreshToken: { type: "string", minLength: 32, maxLength: 512, writeOnly: true } }
      },
      MonitoringAdmin: {
        type: "object",
        required: ["id", "email", "fullName", "role", "permissions", "status"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          role: { type: "string", enum: ["OWNER", "REVIEWER", "READ_ONLY"] },
          permissions: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["ACTIVE", "SUSPENDED"] },
          lastLoginAt: { type: ["string", "null"], format: "date-time" }
        }
      }
    },
    responses: {
      ValidationError: { description: "Invalid query, path, header, or JSON body.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Unauthorized: { description: "Missing, invalid, expired, inactive, or revoked credentials.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Forbidden: { description: "The credential is valid but does not have the required scope or account state.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      NotFound: { description: "The requested bank or resource was not found.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Conflict: { description: "The resource already exists.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      RateLimited: { description: "Too many requests. Retry after a backoff period.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      ServerError: { description: "Unexpected server error. Use the returned requestId when contacting support.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
    }
  },
  paths: {
    "/banks/status": {
      get: {
        tags: ["Public monitoring"],
        summary: "Get the current status of every tracked bank",
        description: "Returns a status map keyed by provider bankCode. The response always includes NIBSS, whose signal is derived from the network and becomes negative when at least five active banks are down. No authentication is required.",
        operationId: "getPublicBankStatus",
        responses: {
          "200": jsonResponse("Current status map keyed by bankCode.", { type: "object", additionalProperties: { $ref: "#/components/schemas/BankStatus" } }),
          ...errorResponses
        }
      }
    },
    "/banks": {
      get: {
        tags: ["Public monitoring"],
        summary: "List all active monitored institutions",
        description: "Returns the active catalog of banks plus the NIBSS national network switch, including identifiers, logo URL, current status, trust score, success rate, latency, and timestamps. NIBSS is not a transfer destination.",
        operationId: "listPublicBanks",
        responses: {
          "200": jsonResponse("Active tracked banks.", { type: "array", items: { $ref: "#/components/schemas/BankStatus" } }),
          ...errorResponses
        }
      }
    },
    "/banks/{bankId}": {
      get: {
        tags: ["Public monitoring"],
        summary: "Get one institution's current signal",
        operationId: "getPublicBank",
        parameters: [{ name: "bankId", in: "path", required: true, description: "Safer Signal bank id returned by GET /banks.", schema: { type: "integer", minimum: 1 }, example: 1 }],
        responses: {
          "200": jsonResponse("Current bank status.", { $ref: "#/components/schemas/BankStatus" }),
          ...errorResponses
        }
      }
    },
    "/banks/{bankId}/events": {
      get: {
        tags: ["Public monitoring"],
        summary: "Get recent signal events for one bank",
        description: "Returns the newest recorded checks and transaction outcomes. The service clamps limit to the range 1–100 and defaults to 50.",
        operationId: "getPublicBankEvents",
        parameters: [
          { name: "bankId", in: "path", required: true, description: "Safer Signal bank id returned by GET /banks.", schema: { type: "integer", minimum: 1 }, example: 1 },
          { name: "limit", in: "query", required: false, description: "Maximum number of events to return.", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 }, example: 25 }
        ],
        responses: {
          "200": jsonResponse("Newest events first.", { type: "array", items: { $ref: "#/components/schemas/BankEvent" } }),
          ...errorResponses
        }
      }
    },
    "/bank-logos/generated/{bankCode}.svg": {
      get: {
        tags: ["Public monitoring"],
        summary: "Get a fallback logo for a bank",
        description: "Returns an SVG fallback generated from the bank name when no supplied logo is available.",
        operationId: "getGeneratedBankLogo",
        parameters: [{ name: "bankCode", in: "path", required: true, description: "Provider bankCode.", schema: { type: "string", minLength: 1, maxLength: 20 }, example: "058" }],
        responses: { "200": { description: "SVG image.", content: { "image/svg+xml": { schema: { type: "string", format: "binary" } } } }, ...errorResponses }
      }
    },
    "/merchant/account": {
      get: {
        tags: ["Merchant API"],
        summary: "Get merchant account and eligibility",
        description: "Use this endpoint as the first authenticated call. An INACTIVE merchant may call it with its issued key. It reports whether the account can read current bank status or contribute transaction outcomes.",
        operationId: "getMerchantAccount",
        security: [{ apiKeyAuth: [] }],
        responses: {
          "200": jsonResponse("Merchant identity, API key metadata, and eligibility.", {
            type: "object",
            properties: {
              merchant: { type: "object", properties: { applicationId: { type: "string", format: "uuid" }, name: { type: "string" }, email: { type: ["string", "null"], format: "email" }, websiteUrl: { type: ["string", "null"], format: "uri" }, status: { type: "string", enum: ["INACTIVE", "ACTIVE", "SUSPENDED", "DELETED"] }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
              apiKey: { type: "object", properties: { keyPrefix: { type: "string", example: "su_live_abc123" }, scopes: { type: "array", items: { type: "string" }, example: ["monitoring:read", "monitoring:write"] }, lastUsedAt: { type: ["string", "null"], format: "date-time" }, expiresAt: { type: ["string", "null"], format: "date-time" }, revokedAt: { type: ["string", "null"], format: "date-time" } } },
              eligibility: { type: "object", properties: { verified: { type: "boolean" }, canReadBankStatus: { type: "boolean" }, canContributeBankStatus: { type: "boolean" }, reason: { type: "string" } } }
            }
          }),
          ...errorResponses
        }
      }
    },
    "/merchant/banks/status": {
      get: {
        tags: ["Merchant API"],
        summary: "Get current bank status for an active merchant",
        description: "Requires an ACTIVE merchant account and the monitoring:read scope. The response is the same status map available publicly and always includes the derived NIBSS signal under the NIBSS key.",
        operationId: "getMerchantBankStatus",
        security: [{ apiKeyAuth: [] }],
        responses: {
          "200": jsonResponse("Current status map keyed by bankCode.", { type: "object", additionalProperties: { $ref: "#/components/schemas/BankStatus" } }),
          ...errorResponses
        }
      }
    },
    "/banks/transaction-status": {
      post: {
        tags: ["Monitoring ingestion"],
        summary: "Submit one transaction outcome",
        description: "Requires an ACTIVE verified merchant account and monitoring:write. Call this after your provider returns a terminal or observed transaction result for an ordinary bank. SUCCESS contributes a positive signal. FAILED only contributes a negative bank signal when failureCategory is BANK_UNAVAILABLE, BANK_TIMEOUT, or NETWORK_ERROR. INSUFFICIENT_FUNDS, INVALID_ACCOUNT, USER_CANCELLED, BUSINESS_RULE, UNKNOWN, PENDING, and REVERSED are retained for history but are neutral to uptime. NIBSS cannot be submitted directly: its signal is recalculated atomically after accepted bank outcomes and becomes negative when at least five active banks are down. Reusing the same bankCode and transactionId is idempotent.",
        operationId: "submitTransactionStatus",
        security: [{ apiKeyAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionStatus" }, example: { bankCode: "058", transactionId: "pmt_01J5Q5Q2T8", status: "FAILED", failureCategory: "BANK_TIMEOUT", latencyMs: 12000, source: "paystack-production" } } } },
        responses: {
          "200": jsonResponse("Updated bank signal, classification, and event id.", {
            type: "object",
            properties: {
              bank: { $ref: "#/components/schemas/BankStatus" },
              nibss: { $ref: "#/components/schemas/BankStatus" },
              signal: { $ref: "#/components/schemas/TransactionSignal" },
              eventId: { type: "string", format: "uuid" }
            }
          }),
          ...errorResponses
        }
      }
    },
    "/business/register": {
      post: {
        tags: ["Business console"],
        summary: "Create an inactive monitoring workspace",
        description: "Creates a merchant workspace in INACTIVE status, issues a read-only API key, and sends an OTP. Manual activation is required before protected bank status access or telemetry contribution is allowed. The raw API key is returned once in the registration response; store it securely.",
        operationId: "registerBusinessWorkspace",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessRegistration" }, example: { name: "Acme Payments", email: "ops@acme.com", websiteUrl: "https://acme.com" } } } },
        responses: {
          "201": jsonResponse("Workspace created and OTP issued.", { type: "object", properties: { message: { type: "string" }, status: { type: "string", example: "INACTIVE" }, applicationId: { type: "string", format: "uuid" }, apiKey: { type: "string", writeOnly: true, example: "su_live_..." }, clientId: { type: "string", example: "su_live_abc123" } } }),
          ...errorResponses
        }
      }
    },
    "/business/login": {
      post: {
        tags: ["Business console"],
        summary: "Request a business OTP",
        operationId: "requestBusinessOtp",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BusinessEmail" }, example: { email: "ops@acme.com" } } } },
        responses: { "200": jsonResponse("OTP sent to the registered business email.", { type: "object", properties: { message: { type: "string" } } }), ...errorResponses }
      }
    },
    "/business/verify-otp": {
      post: {
        tags: ["Business console"],
        summary: "Verify OTP and create a business session",
        operationId: "verifyBusinessOtp",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyOtp" }, example: { email: "ops@acme.com", otp: "123456" } } } },
        responses: {
          "200": jsonResponse("Short-lived session and workspace state.", { type: "object", properties: { message: { type: "string" }, accessToken: { type: "string", writeOnly: true }, refreshToken: { type: "string", writeOnly: true }, clientId: { type: "string" }, applicationId: { type: "string", format: "uuid" }, name: { type: "string" }, websiteUrl: { type: ["string", "null"], format: "uri" }, status: { type: "string", enum: ["INACTIVE", "ACTIVE"] }, canContributeBankStatus: { type: "boolean" }, email: { type: "string", format: "email" } } }),
          ...errorResponses
        }
      }
    },
    "/business/refresh": {
      post: {
        tags: ["Business console"],
        summary: "Refresh a business session",
        description: "Exchanges a valid refresh token for a new 15-minute access token and a new refresh token. The previous refresh token is revoked immediately, so the client must persist the newly returned token. Refresh tokens expire after 30 days of absolute lifetime; after that the business must complete OTP verification again.",
        operationId: "refreshBusinessSession",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshSession" } } } },
        responses: {
          "200": jsonResponse("Rotated access and refresh tokens.", { type: "object", properties: { message: { type: "string" }, accessToken: { type: "string", writeOnly: true }, refreshToken: { type: "string", writeOnly: true }, secretKey: { type: "string", writeOnly: true }, clientId: { type: "string" }, applicationId: { type: "string", format: "uuid" }, name: { type: "string" }, websiteUrl: { type: ["string", "null"], format: "uri" }, status: { type: "string", enum: ["INACTIVE", "ACTIVE"] }, canContributeBankStatus: { type: "boolean" }, email: { type: "string", format: "email" } } }),
          ...errorResponses
        }
      }
    },
    "/business/credentials": {
      get: {
        tags: ["Business console"],
        summary: "List credential metadata",
        description: "Returns key prefixes, scopes, and lifecycle timestamps. Raw secret keys are never returned by this endpoint.",
        operationId: "listBusinessCredentials",
        security: [{ businessBearer: [], clientId: [] }],
        responses: {
          "200": jsonResponse("Credential metadata.", { type: "object", properties: { applicationId: { type: "string", format: "uuid" }, keys: { type: "array", items: { type: "object", properties: { id: { type: "string", format: "uuid" }, keyPrefix: { type: "string" }, scopes: { type: "array", items: { type: "string" } }, lastUsedAt: { type: ["string", "null"], format: "date-time" }, expiresAt: { type: ["string", "null"], format: "date-time" }, revokedAt: { type: ["string", "null"], format: "date-time" }, createdAt: { type: "string", format: "date-time" } } } } } }),
          ...errorResponses
        }
      }
    },
    "/business/credentials/rotate": {
      post: {
        tags: ["Business console"],
        summary: "Rotate the merchant API key",
        description: "Requires an ACTIVE workspace. Revokes all currently active keys and returns one new raw key. Store the new key immediately; it is not available again.",
        operationId: "rotateBusinessCredentials",
        security: [{ businessBearer: [], clientId: [] }],
        responses: {
          "201": jsonResponse("New credential returned once.", { type: "object", properties: { applicationId: { type: "string", format: "uuid" }, clientId: { type: "string" }, apiKey: { type: "string", writeOnly: true }, scopes: { type: "array", items: { type: "string" }, example: ["monitoring:read", "monitoring:write"] } } }),
          ...errorResponses
        }
      }
    },
    "/admin/auth/request-otp": {
      post: {
        tags: ["Signal administration"],
        summary: "Request a Signal operator OTP",
        description: "Sends a one-time code only when the email belongs to an active, pre-provisioned Signal operator. The response is intentionally generic to avoid account enumeration.",
        operationId: "requestMonitoringAdminOtp",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MonitoringAdminEmail" } } } },
        responses: { "200": jsonResponse("Generic OTP request response.", { type: "object", properties: { message: { type: "string" } } }), ...errorResponses }
      }
    },
    "/admin/auth/verify-otp": {
      post: {
        tags: ["Signal administration"],
        summary: "Verify operator OTP",
        operationId: "verifyMonitoringAdminOtp",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MonitoringAdminVerifyOtp" } } } },
        responses: { "200": jsonResponse("Operator session with access and refresh tokens.", { type: "object", properties: { accessToken: { type: "string", writeOnly: true }, refreshToken: { type: "string", writeOnly: true }, admin: { $ref: "#/components/schemas/MonitoringAdmin" } } }), ...errorResponses }
      }
    },
    "/admin/auth/refresh": {
      post: {
        tags: ["Signal administration"],
        summary: "Refresh a Signal operator session",
        description: "Rotates the administrator refresh token and returns a new short-lived access token.",
        operationId: "refreshMonitoringAdminSession",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MonitoringAdminRefreshSession" } } } },
        responses: { "200": jsonResponse("Rotated operator session.", { type: "object", properties: { accessToken: { type: "string", writeOnly: true }, refreshToken: { type: "string", writeOnly: true }, admin: { $ref: "#/components/schemas/MonitoringAdmin" } } }), ...errorResponses }
      }
    },
    "/admin/auth/logout": {
      post: {
        tags: ["Signal administration"],
        summary: "Revoke a Signal operator refresh token",
        operationId: "logoutMonitoringAdmin",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MonitoringAdminRefreshSession" } } } },
        responses: { "200": jsonResponse("Operator refresh token revoked.", { type: "object", properties: { message: { type: "string" } } }), ...errorResponses }
      }
    },
    "/admin/auth/me": {
      get: {
        tags: ["Signal administration"],
        summary: "Get the current Signal operator",
        operationId: "getMonitoringAdminProfile",
        security: [{ monitoringAdminBearer: [] }],
        responses: { "200": jsonResponse("Current operator profile.", { type: "object", properties: { admin: { $ref: "#/components/schemas/MonitoringAdmin" } } }), ...errorResponses }
      }
    },
    "/admin/business-applications": {
      get: {
        tags: ["Signal administration"],
        summary: "List merchant applications for review",
        description: "Returns business workspaces and safe API-key metadata. The default queue is INACTIVE and results are paginated.",
        operationId: "listMonitoringBusinessApplications",
        security: [{ monitoringAdminBearer: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["INACTIVE", "ACTIVE", "REJECTED", "SUSPENDED", "DELETED", "all"], default: "INACTIVE" } },
          { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } }
        ],
        responses: { "200": jsonResponse("Paginated merchant applications.", { type: "object", properties: { applications: { type: "array", items: { type: "object" } }, total: { type: "integer" }, limit: { type: "integer" }, offset: { type: "integer" } } }), ...errorResponses }
      }
    },
    "/admin/business-applications/summary": {
      get: {
        tags: ["Signal administration"],
        summary: "Get application status counts",
        operationId: "getMonitoringBusinessApplicationSummary",
        security: [{ monitoringAdminBearer: [] }],
        responses: { "200": jsonResponse("Application counts by lifecycle state.", { type: "object", properties: { pending: { type: "integer" }, active: { type: "integer" }, rejected: { type: "integer" }, suspended: { type: "integer" }, total: { type: "integer" } } }), ...errorResponses }
      }
    },
    "/admin/business-applications/{applicationId}": {
      get: {
        tags: ["Signal administration"],
        summary: "Inspect a business application",
        operationId: "getMonitoringBusinessApplication",
        security: [{ monitoringAdminBearer: [] }],
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Business application, safe credential metadata, and recent review history.", { type: "object", properties: { application: { type: "object" }, reviewHistory: { type: "array", items: { type: "object" } } } }), ...errorResponses }
      }
    },
    "/admin/business-applications/{applicationId}/review-history": {
      get: {
        tags: ["Signal administration"],
        summary: "Get the full review history",
        operationId: "getMonitoringBusinessApplicationHistory",
        security: [{ monitoringAdminBearer: [] }],
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": jsonResponse("Auditable approval decisions.", { type: "object", properties: { applicationId: { type: "string", format: "uuid" }, reviews: { type: "array", items: { type: "object" } } } }), ...errorResponses }
      }
    },
    "/admin/business-applications/{applicationId}/approve": monitoringAdminDecisionOperation("Approve a business application", "Requires merchant_applications.manage. Moves an INACTIVE, REJECTED, or SUSPENDED business application to ACTIVE and enables its monitoring scopes."),
    "/admin/business-applications/{applicationId}/reject": monitoringAdminDecisionOperation("Reject a business application", "Requires merchant_applications.manage. A reason of at least 10 characters is required."),
    "/admin/business-applications/{applicationId}/suspend": monitoringAdminDecisionOperation("Suspend a business application", "Requires merchant_applications.manage. A reason of at least 10 characters is required."),
    "/admin/business-applications/{applicationId}/reactivate": monitoringAdminDecisionOperation("Reactivate a business application", "Requires merchant_applications.manage. Moves a suspended or rejected application to ACTIVE."),
    "/business/banks/status": {
      get: {
        tags: ["Business console"],
        summary: "Read current status in the business console",
        description: "Uses the OTP-issued business session and is read-only. The status map always includes the derived NIBSS signal. An inactive workspace can enter the console and view public monitoring, but cannot contribute telemetry.",
        operationId: "getBusinessConsoleBankStatus",
        security: [{ businessBearer: [], clientId: [] }],
        responses: {
          "200": jsonResponse("Current status map keyed by bankCode.", { type: "object", additionalProperties: { $ref: "#/components/schemas/BankStatus" } }),
          ...errorResponses
        }
      }
    }
  }
};
