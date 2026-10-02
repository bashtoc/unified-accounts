# Safer Unified Product Requirements Document

## 1. Product Summary

Safer Unified is a phone-number-based unified bank account identity platform. A user links multiple bank accounts to one verified phone number, then authorizes specific businesses to retrieve only the bank details that user has permitted.

The product does not move money. It identifies bank accounts, manages user consent, and provides bank-network monitoring so businesses can verify bank availability before showing or accepting a bank as a payment destination.

## 2. Goals

- Let individuals manage all linked bank accounts under one verified phone number.
- Let users authorize, review, and revoke business access to their bank details.
- Let verified businesses retrieve bank details only for users who granted consent.
- Provide a corporate dashboard for API keys, consent requests, lookups, monitoring, and access logs.
- Provide real-time bank service monitoring with availability status and trust scores.
- Prevent phone-number enumeration, unauthorized bank-detail exposure, and broad data scraping.

## 3. Non-Goals

- Safer Unified will not initiate, process, settle, reverse, or hold payments in the first release.
- Safer Unified will not replace bank KYC, account validation, or fraud-screening obligations.
- Safer Unified will not expose full bank details to businesses without explicit user authorization.
- Safer Unified will not allow public unauthenticated bank-account lookup by phone number.

## 4. Users

### Individual Users

Individuals register and log in with phone-number OTP. They add, edit, remove, and prioritize bank accounts. They review businesses they have authorized and revoke access at any time.

### Businesses

Businesses register for a corporate account, verify their organization, create API keys, request user consent, retrieve authorized bank details, inspect bank service status, and monitor lookup activity.

### Admin Operators

Internal operators review business verification, configure banks, monitor abuse, inspect audit logs, and manage bank-network monitoring sources.

Admin operators also manage the business-application approval queue. New business workspaces remain `INACTIVE` after signup and OTP verification. Only an MFA-authenticated administrator with the merchant-application permission can approve, reject, suspend, or reactivate a workspace. Every decision records the reviewer, timestamp, previous status, new status, and reason when required.

## 5. Core User Stories

- As a user, I can log in with my phone number and OTP.
- As a user, I can add bank name, account number, account name, and mark a preferred bank.
- As a user, I can see all businesses I previously authorized.
- As a user, I can revoke a business authorization immediately.
- As a user, I can choose which linked accounts a business may see.
- As a business, I can request access to a user's bank accounts using the user's phone number.
- As a business, I can retrieve bank accounts only after the user authorizes my business.
- As a business, I can see whether a bank network is active before presenting it to a payer.
- As a business, I can view bank trust scores and recent incidents.
- As an admin, I can update or ingest bank availability and trust signals.
- As an admin, I can review and approve business monitoring applications before API access is enabled.
- As an admin, I can reject or suspend a business with an auditable reason.

## 6. Authentication And Authorization

### Individual Login

1. User enters phone number.
2. Backend creates an OTP challenge.
3. Backend sends OTP through SMS or WhatsApp provider.
4. User submits OTP.
5. Backend verifies OTP, creates a user session, and returns a session token or sets an HttpOnly secure cookie.
6. Frontend opens the individual dashboard.

Production requirements:

- OTP expires after 5 minutes.
- OTP retry limit is 5 attempts per challenge.
- OTP resend cooldown is at least 60 seconds.
- Login attempts are rate-limited by phone number, IP, and device fingerprint.
- OTPs are hashed at rest.
- Sessions are stored server-side in Redis or MySQL.
- Browser sessions should use secure, HttpOnly, SameSite cookies where possible.

### Business Login

Businesses log in with email/password plus MFA or magic link plus MFA. Businesses receive API access only after organization verification.

### API Authorization

Business API calls require a business access token or signed API key. A valid business credential is never enough by itself. The backend must also check active user consent for the requested phone number and requested scope.

## 7. Consent Model

Consent is the security boundary of the product.

A business can access user bank details only when:

- The business is verified and active.
- The user exists and owns the phone number.
- The user has granted active consent to that business.
- The consent has not expired or been revoked.
- The requested endpoint is covered by the granted scopes.
- The requested bank accounts are included in the consent.

Consent scopes:

- `accounts:read`: Read permitted linked bank accounts.
- `accounts:add`: Add a bank account on behalf of a user.
- `accounts:preferred-read`: Read preferred/default bank metadata.
- `monitoring:read`: Read bank availability and trust-score data.

Consent statuses:

- `pending`
- `active`
- `revoked`
- `expired`
- `denied`

## 8. Individual Dashboard Requirements

### Overview

- Show unified number.
- Show profile verification status.
- Show total linked banks.
- Show default/preferred bank.
- Show recent access events.

### Linked Banks

- Add bank account manually.
- Edit bank name, account number, account name, visibility, and preferred status.
- Remove bank account.
- Choose preferred bank.
- Optionally hide a bank from public/authorized lookup.

### Authorized Businesses

- List businesses with active, expired, revoked, and pending consent.
- Show business name, logo, verification status, scopes, authorized banks, created date, expiry date, and last access.
- Revoke active authorization.
- Re-authorize expired or revoked authorization.
- View access history for each business.

### Consent Approval Flow

- User receives or opens a consent request.
- User reviews business identity, requested data, scopes, duration, and purpose.
- User selects which bank accounts are visible to the business.
- User approves or denies the request.

## 9. Corporate Dashboard Requirements

### Business Overview

- Show verification status.
- Show active API keys.
- Show monthly lookups.
- Show consent conversion rate.
- Show bank monitoring health summary.

### Consent Requests

- Create consent request by phone number.
- Show pending, approved, denied, expired, and revoked requests.
- Copy hosted consent link.
- Track consent request status.

### Authorized Lookups

- Search by phone number.
- Retrieve only users with active consent.
- Show permitted bank accounts.
- Display bank network status beside each account.
- Highlight preferred bank.
- Show last refreshed timestamp.

### API Keys

- Create API key.
- Rotate API key.
- Revoke API key.
- Restrict key by IP allowlist, environment, scopes, and rate limits.

### Monitoring

- Show all supported banks.
- Show current status: `operational`, `degraded`, `down`, or `unknown`.
- Show trust score from 0 to 100.
- Show recent incidents and latency.
- Provide webhook settings for status changes.

### Audit Logs

- Show business user actions.
- Show API lookups.
- Show failed authorization attempts.
- Export logs for compliance review.

## 10. Bank Monitoring Feature

The monitoring service tracks bank network health and exposes a source of truth for businesses before customers are allowed to send money to a selected bank.

### Bank Status Fields

- Bank ID
- Bank name
- Slug
- Logo URL
- Current status
- Trust score
- Success rate
- Average response time
- Last checked timestamp
- Last incident timestamp
- Incident summary
- Data source

### Trust Score Rules

Trust score is a weighted score from 0 to 100.

- Recent uptime: 40%
- Successful validation checks: 25%
- Latency stability: 15%
- Incident frequency: 10%
- Manual admin confidence: 10%

Example thresholds:

- `90-100`: Excellent
- `75-89`: Healthy
- `60-74`: Degraded
- `1-59`: High risk
- `0`: Down or unknown

### Monitoring Data Sources

MVP may support manual admin updates and simulated checks. Production should support multiple sources:

- Bank status integrations where available.
- Account-name resolution success/failure rates.
- Business-reported transaction availability events.
- Admin incident updates.
- Third-party payment infrastructure signals.

### Business Use

Before showing a bank account as a payment destination, the business calls the monitoring endpoint. If the selected bank is down or low-trust, the business can warn the payer, select another authorized bank, or pause the payment flow.

### Business Application Approval

Business applications use these states:

- `INACTIVE`: registered and awaiting manual review; no protected monitoring access.
- `ACTIVE`: approved; unrevoked API keys receive `monitoring:read` and `monitoring:write`.
- `REJECTED`: declined and unable to authenticate to protected monitoring resources.
- `SUSPENDED`: previously approved but currently blocked from monitoring access.
- `DELETED`: terminal state; cannot be reviewed or reactivated.

The approval queue is available only in the Signal administrator console at `/admin`. Signal operators are pre-provisioned in the Signal database and authenticate with email OTP. The monitoring service issues short-lived JWT access tokens and rotates refresh tokens; role and permission checks are enforced inside Signal. Business sessions and merchant API keys cannot call approval endpoints.

## 11. API Requirements

### Individual Auth

`POST /api/auth/request-otp`

Request:

```json
{
  "phoneNumber": "08012345678"
}
```

Response:

```json
{
  "challengeId": "otp_challenge_id",
  "expiresInSeconds": 300
}
```

`POST /api/auth/verify-otp`

Request:

```json
{
  "challengeId": "otp_challenge_id",
  "phoneNumber": "08012345678",
  "otp": "123456"
}
```

Response:

```json
{
  "accessToken": "user_session_token",
  "user": {
    "id": "user_id",
    "phoneNumber": "08012345678",
    "name": "Tony Obasi"
  }
}
```

`POST /api/auth/logout`

Invalidates the active user session.

### User Profile And Banks

`GET /api/me`

Returns the logged-in user profile.

`GET /api/me/banks`

Returns the logged-in user's linked bank accounts.

`POST /api/me/banks`

Adds a bank account.

`PUT /api/me/banks/:bankAccountId`

Updates a bank account.

`DELETE /api/me/banks/:bankAccountId`

Removes a bank account.

`PATCH /api/me/banks/:bankAccountId/default`

Sets preferred bank account.

### User Authorizations

`GET /api/me/authorizations`

Returns all business authorizations for the logged-in user.

`GET /api/me/authorizations/:authorizationId`

Returns authorization details and access history.

`POST /api/me/authorizations/:authorizationId/approve`

Approves a pending business consent request.

`POST /api/me/authorizations/:authorizationId/deny`

Denies a pending business consent request.

`DELETE /api/me/authorizations/:authorizationId`

Revokes authorization.

### Business Auth And Dashboard

`POST /api/business/auth/login`

Business login.

`GET /api/business/me`

Returns business profile.

`GET /api/business/api-keys`

Lists API keys.

`POST /api/business/api-keys`

Creates API key.

`DELETE /api/business/api-keys/:apiKeyId`

Revokes API key.

### Business Consent

`POST /api/business/consent-requests`

Creates a user consent request.

Request:

```json
{
  "phoneNumber": "08012345678",
  "scopes": ["accounts:read"],
  "purpose": "Show available bank accounts before checkout",
  "expiresInDays": 90
}
```

`GET /api/business/consent-requests`

Lists consent requests.

`GET /api/business/consent-requests/:requestId`

Gets consent request status.

### Authorized Business Lookup

`GET /api/business/unified-accounts/:phoneNumber`

Requires business authentication and active user consent.

Response:

```json
{
  "phoneNumber": "08012345678",
  "accountName": "Tony Obasi",
  "accounts": [
    {
      "id": "bank_account_id",
      "bankName": "GTBank",
      "accountNumber": "0123456789",
      "accountName": "Tony Obasi",
      "preferred": true,
      "bankStatus": "operational",
      "trustScore": 94
    }
  ]
}
```

If consent is missing:

```json
{
  "status": "authorization_required",
  "message": "This business is not authorized to access this user's linked bank accounts."
}
```

### Bank Monitoring

`GET /api/banks`

Lists supported banks.

`GET /api/banks/status`

Returns all bank status records.

`GET /api/banks/:bankId/status`

Returns one bank's current status.

`POST /api/admin/banks/:bankId/status`

Admin-only endpoint for manual monitoring update.

`POST /api/business/bank-status-events`

Allows verified businesses to submit observed bank-service events, subject to trust weighting and abuse controls.

`GET /api/business/banks/status`

Business endpoint for status and trust score before showing payment destination options.

### Business Application Administration

`GET /api/v1/admin/business-applications?status=INACTIVE&search=&limit=25&offset=0`

Lists business applications for the administrator approval queue. The default page size is 25 and the maximum is 100.

`GET /api/v1/admin/business-applications/:applicationId`

Returns a sanitized application profile, API-key scope summary, and recent review history. Raw API keys are never returned.

`POST /api/v1/admin/business-applications/:applicationId/approve`

Activates the application and grants active, unrevoked keys the monitoring read and write scopes.

`POST /api/v1/admin/business-applications/:applicationId/reject`

Rejects the application. Requires a reason of at least 10 characters.

`POST /api/v1/admin/business-applications/:applicationId/suspend`

Suspends an active application. Requires a reason of at least 10 characters.

## 12. Data Model

### users

- id
- phone_number
- display_name
- status
- created_at
- updated_at

### otp_challenges

- id
- phone_number
- otp_hash
- attempts
- expires_at
- consumed_at
- created_at

### user_sessions

- id
- user_id
- token_hash
- expires_at
- revoked_at
- created_at

### bank_accounts

- id
- user_id
- bank_id
- bank_name
- account_number_encrypted
- account_name
- is_preferred
- is_visible
- created_at
- updated_at

### businesses

- id
- name
- registration_number
- website
- contact_email
- verification_status
- status
- created_at
- updated_at

### business_users

- id
- business_id
- name
- email
- role
- mfa_enabled
- created_at

### business_api_keys

- id
- business_id
- key_hash
- key_prefix
- scopes
- ip_allowlist
- status
- created_at
- last_used_at
- revoked_at

### business_user_authorizations

- id
- user_id
- business_id
- scopes
- allowed_bank_account_ids
- purpose
- status
- expires_at
- approved_at
- revoked_at
- created_at

### bank_statuses

- id
- bank_id
- status
- trust_score
- success_rate
- average_latency_ms
- source
- checked_at
- updated_at

### bank_status_events

- id
- bank_id
- reported_by_type
- reported_by_id
- event_type
- status
- latency_ms
- metadata
- created_at

### access_logs

- id
- actor_type
- actor_id
- user_id
- business_id
- action
- endpoint
- ip_address
- user_agent
- status_code
- metadata
- created_at

## 13. Security Requirements

- Enforce object-level authorization on every user, bank account, consent, and business resource.
- Never return bank details from a public endpoint.
- Encrypt account numbers at rest.
- Hash OTPs, sessions, and API keys.
- Rate-limit OTP, phone lookup, consent request, and monitoring endpoints.
- Detect phone-number enumeration and sequential lookup abuse.
- Use TLS in all environments outside local development.
- Use audit logs for all sensitive reads and writes.
- Support API key rotation and revocation.
- Require MFA for business dashboard users.
- Use least-privilege scopes for API keys and consent.
- Do not expose internal IDs that can be guessed where avoidable.
- Sanitize and validate all inputs with schema validation.

Security references:

- OWASP API Security Top 10 2023, especially broken object-level authorization and unrestricted resource consumption.
- OpenID FAPI 2.0 for high-value API security patterns.
- NIST SP 800-63B for authentication lifecycle and authenticator assurance.

## 14. MVP Development Phases

### Phase 1: Secure Individual Dashboard

- Persist users, OTP challenges, sessions, and bank accounts in MySQL.
- Finish individual login with OTP challenge records.
- Add user dashboard linked-bank CRUD.
- Add user authorization list and revoke action.

### Phase 2: Business Dashboard

- Add business auth.
- Add business profile and API keys.
- Add consent request creation and tracking.
- Add authorized user lookup.
- Add access logs.

### Phase 3: Consent Approval Flow

- Add hosted consent page.
- Let users approve, deny, and limit banks per business.
- Add expiry and revocation.
- Notify businesses when consent changes.

### Phase 4: Bank Monitoring

- Add banks and bank status tables.
- Add monitoring dashboard.
- Add business status endpoint.
- Add admin update endpoint.
- Add trust-score calculation.

### Phase 5: Hardening

- Add Redis-backed sessions and rate limits.
- Add API key hashing and rotation.
- Add business MFA.
- Add webhook notifications.
- Add anomaly detection for lookups and status manipulation.

## 15. Acceptance Criteria

- A user can log in with phone OTP and manage linked bank accounts.
- A user can view and revoke authorized businesses.
- A business cannot retrieve bank details without active user consent.
- A business with active consent can retrieve only permitted bank accounts.
- Every sensitive lookup creates an access log.
- A business can view bank network status and trust score before showing a payment destination.
- Bank trust score updates when monitoring events are added.
- New business signups remain inactive until an authorized administrator approves them.
- The administrator can search, filter, inspect, approve, reject, suspend, and reactivate business applications.
- Approval grants monitoring scopes atomically and creates a review-history record.
- Rejection and suspension require a reason and prevent protected monitoring access.
- Business approval routes reject business sessions and merchant API keys.
- Unauthorized access attempts return `401` or `403` and never leak bank data.
- The frontend contains separate individual and corporate dashboard flows.
- The backend exposes REST endpoints documented in this PRD.
