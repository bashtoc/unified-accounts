# Safer Signal monitoring backend

Node.js, Express, MySQL 8, and Prisma backend for public bank-network monitoring.

Safer Signal exposes current availability, uptime, latency, trust scores, event history, and a backend-owned featured bank catalog. It does not hold, route, settle, or transfer money.

## Run locally

```sh
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The production API base URL is:

```text
https://signal.saference.com/api/v1
```

For local development, the API listens on `http://localhost:4002` and the frontend uses:

```sh
VITE_API_URL=http://localhost:4002/api/v1
```

Swagger UI is available at `https://signal.saference.com/docs` in production or `http://localhost:4002/docs` locally. The machine-readable OpenAPI document is available at `/openapi.json` on the same host.

## Monitoring model

Only manually activated, verified merchant integrations can submit transaction outcomes. Successful transactions increase confidence. `BANK_UNAVAILABLE`, `BANK_TIMEOUT`, and `NETWORK_ERROR` failures reduce the uptime signal. User-level failures such as insufficient funds, invalid account details, cancellation, and business rules are recorded for audit history but do not reduce bank uptime.

Every submission requires a `transactionId`. Recent transaction IDs are checked for duplicates so client retries do not double-count a signal. API-key writes require the `monitoring:write` scope.

Bank catalog records also expose `logoUrl`, `featured`, and `displayOrder`. Bank identifiers are kept separate: `bankCode` is the provider transfer code returned as Paystack `code` and is the value to pass as `bank_code` to Paystack account resolution and transfer-recipient APIs; `nipInstitutionCode` is the NIP institution identifier returned by Paystack when `include_nip_sort_code=true`; `longCode` is Paystack's optional `longcode` value. Do not substitute the NIP identifier for a provider `bank_code` unless the downstream NIP integration explicitly requires it.

The seed refreshes from Paystack's NGN catalog with NIP institution codes enabled, filters to active non-deleted Nigerian institutions, and keeps one canonical record per provider `bankCode`. It marks missing catalog records inactive instead of deleting their monitoring history.

```json
{
  "bankCode": "058",
  "transactionId": "tx_123",
  "status": "FAILED",
  "failureCategory": "BANK_UNAVAILABLE",
  "latencyMs": 240,
  "source": "bank-integration"
}
```

## Endpoint contract

All JSON responses use this envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Errors use `error.code`, `error.message`, optional `error.fields`, and a `requestId` for support. The complete parameter and response contract is maintained in Swagger at `/docs`.

Public, read-only:

- `GET /api/v1/banks/status`
- `GET /api/v1/banks`
- `GET /api/v1/banks/:bankId`
- `GET /api/v1/banks/:bankId/events?limit=50` where `limit` is capped at 100

API-key ingestion:

- `GET /api/v1/merchant/account` with `X-API-Key` to inspect merchant status and read/contribution eligibility
- `GET /api/v1/merchant/banks/status` with `X-API-Key` and `monitoring:read`
- `POST /api/v1/banks/transaction-status` with `X-API-Key` and `monitoring:write`

Business console:

- `POST /api/v1/business/register`
- `POST /api/v1/business/login`
- `POST /api/v1/business/verify-otp`
- `GET /api/v1/business/credentials`
- `POST /api/v1/business/credentials/rotate`
- `GET /api/v1/business/banks/status`

Production examples use `https://signal.saference.com/api/v1` as the base URL. Merchant API calls send the raw server-side key in `X-API-Key`; business-console calls send `ClientID` plus the OTP-issued bearer token.

Business console requests use a short-lived bearer session plus the `ClientID` header and are read-only. The dashboard has no status-reporting form. API keys are shown only when created or rotated; keep them on a trusted server and never in browser code.

New business workspaces are created with `INACTIVE` status and a read-only API key. After OTP verification they can enter the read-only dashboard, where the header shows `Account inactive`. They cannot use the merchant API to read protected status or contribute signals until manually activated by an operator. The production workflow is the MFA-protected admin console under **Business approvals**. Every decision records the administrator, timestamp, previous status, new status, and reason where applicable.

For emergency or controlled local operations, the legacy activation command now uses the same approval service and requires an explicit reviewer identity:

```sh
npm run business:activate -- merchant@example.com
```

Set `MONITORING_ADMIN_REVIEWER_ID` and `MONITORING_ADMIN_REVIEWER_EMAIL` before using the command. Approval changes the workspace to `ACTIVE` and grants its unrevoked API keys `monitoring:read` and `monitoring:write` scopes. Rejection changes it to `REJECTED`; suspension changes it to `SUSPENDED`. The public bank-monitoring pages remain read-only and do not require a merchant account.

Signal administration is native to this service. Operators are provisioned directly in the Signal database with `npm run admin:bootstrap`, authenticate at `/admin/login` with email OTP, and receive a short-lived JWT access token plus a rotating refresh token. Business approval endpoints are protected by the Signal operator role and permission model; they are not authenticated by business sessions or merchant API keys.

## Data and cleanup

Bank signal events are stored in `BankStatusEvent`; the rolling scoring window is stored in `Bank.recentReports`. The current Prisma model contains only monitoring, business workspace, API key, OTP session, and request-observability data. Legacy account, consent, profile, and identity tables from the previous product may still exist physically in an existing database, but no current route, service, or Prisma model can read or write them. Remove those tables in a separately approved archival migration when their retention requirements are complete.
