# Platform Error Contract

**Owner:** SIC Platform  
**Applies to:** All Lambda/API handlers wrapped by `withPlatform()`  
**Goal:** Deterministic, safe, operable error semantics across services.

---

## Goals

- Deterministic client behavior under failure (**4XX vs 5XX**).
- Safe-by-default error bodies (no secrets, no internal stack traces).
- Explicit retry guidance via `retryable`.
- Always return correlation headers for post-authorizer failures:
  - `x-correlation-id`
  - `X-Correlation-Id`

---

## Error Response Envelope

All **post-authorizer** errors MUST return:

- an HTTP status code (mapped deterministically)
- JSON body:

```json
{
  "error": {
    "code": "platform.forbidden",
    "message": "Forbidden",
    "retryable": false,
    "details": {}
  },
  "correlationId": "abc_def-1234",
  "requestId": "lambda-awsRequestId"
}
```

### Field rules

- `error.code` (required): stable, machine-parseable string.
- `error.message` (required): safe, user-facing message. **Generic by default.**
- `error.retryable` (required): boolean.
- `error.details` (optional): **safe metadata only** (field names, categories).
  - MUST NOT include secrets, tokens, raw exceptions, stack traces.
  - SHOULD NOT include PII. (If you include identifiers in dev, gate behind env.)
- `correlationId` (required): validated client correlation id or fallback.
- `requestId` (required): Lambda `context.awsRequestId` (canonical).

---

## Pre-Lambda Authorizer Errors

Some authentication failures are returned by the API Gateway/JWT authorizer layer **before Lambda executes**.

- These responses may be **401** with `WWW-Authenticate`
- They may have **empty body** and will not include platform correlation headers

**Contract scope:** This document guarantees behavior for **post-authorizer** errors handled by `withPlatform()` and downstream modules (tenant context, handlers, repositories).

---

## Status Mapping

| HTTP | Category | Meaning                                     | Example `error.code` values                   | retryable         |
| ---: |----------|-------------------------------------------- |---------------------------------------------- |------------------ |
| 400  | Client   | Invalid input / missing required fields     | `platform.bad_request`                        | false             |
| 401  | Auth     | Not authenticated (may be pre-Lambda)       | `platform.unauthorized`                       | false             |
| 403  | AuthZ    | Authenticated but not entitled              | `platform.forbidden`                          | false             |
| 404  | Client   | Resource not found                          | `platform.not_found`, `athletes.not_found`    | false             |
| 409  | Client   | Conflict / conditional failure              | `platform.conflict`                           | false             |
| 429  | Client   | Throttled / rate-limited                    | `platform.throttled`                          | false             |
| 500  | Server   | Unexpected internal fault                   | `platform.internal`                           | false (default)   |
| 503  | Server   | Service unavailable / transient dependency  | `platform.unavailable`                        | true              |

---

## Retry Rules (Client Guidance)

Clients MUST only retry when:

1. `error.retryable == true`, AND
2. the operation is safe to retry:
   - **GET/HEAD**: generally safe to retry
   - **POST/PUT/PATCH/DELETE**: retry only if **idempotent**
     - e.g., `Idempotency-Key` supported and enforced
     - or conditional writes prevent duplicate side effects

Clients MUST NOT retry any **4XX**.

### Backoff & jitter
When retrying (especially for 503), use exponential backoff with jitter and enforce a max retry count to prevent retry storms.

---

## Throttling Notes

- When the platform must shed load, return **429** (`platform.throttled`).
- Client behavior:
  - slow down requests
  - exponential backoff + jitter
  - bounded retries
- Avoid retry storms: do not retry 4XX, and do not retry 5XX unless `retryable=true`.

---

## Timeout Guidance

Timeouts must be explicit and sized for:

- cold start worst case
- downstream tail latency (e.g., DynamoDB)
- safety margin to avoid partial work + client retries

Prefer deterministic, classified failures over silent timeouts.

---

## Evidence (Week 4 Day 2)

### Deterministic 400 (bad input)
Missing `Idempotency-Key` on `POST /athletes`:
- HTTP 400
- `error.code = platform.bad_request`
- `retryable = false`
- includes `correlationId` + `requestId`

### Deterministic 403 (missing entitlements)
When entitlements record is missing:
- HTTP 403
- `error.code = platform.forbidden`
- `retryable = false`
- includes `correlationId` + `requestId`

### Deterministic idempotency replay
`POST /athletes` with same `Idempotency-Key`:
- first request: 201, `replayed=false`
- replay: 200, `replayed=true`
- same athlete identity returned
