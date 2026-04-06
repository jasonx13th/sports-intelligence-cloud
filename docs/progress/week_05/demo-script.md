# Club Vivo Week 5 Demo Runbook

## Purpose
This runbook is a 5-minute demo and operator checklist for the Club Vivo dev environment.

It covers the current golden path:
- create or sign in a user
- confirm the authoritative entitlements row exists
- verify `/me`
- create and list sessions
- generate a session pack
- export a session PDF
- confirm cross-tenant access still fails closed

## Non-Negotiable Tenant Rule
Tenant scope comes only from:
- verified auth context
- the authoritative entitlements store in DynamoDB

Never send or accept `tenant_id` from:
- request body
- query string
- headers such as `x-tenant-id`

All commands below rely on bearer tokens only. The backend derives tenant scope server-side from verified auth plus entitlements.

## Demo Defaults
- Dev API URL: `https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com`
- Cognito client id: `4ssfq7va608hr9uolatbhsma7q`
- Region: `us-east-1`

## Prereqs
- AWS CLI is configured for the correct account and region
- A confirmed dev user exists in Cognito
- The user has an entitlements row in `sic-tenant-entitlements-dev`
- PowerShell is available

## 1. Create User -> Confirm Entitlements Row Exists
If the user already exists, skip to the token step.

Find the user and capture the Cognito `sub`:

```powershell
$Region = "us-east-1"
$UserPoolId = "<your-user-pool-id>"
$Username = "<coach-email-or-username>"

aws cognito-idp admin-get-user `
  --region $Region `
  --user-pool-id $UserPoolId `
  --username $Username
```

Confirm the entitlements row exists in DynamoDB and contains the required fields:

```powershell
$Sub = "<copy-sub-from-admin-get-user>"

aws dynamodb get-item `
  --region $Region `
  --table-name "sic-tenant-entitlements-dev" `
  --key "{""user_sub"":{""S"":""$Sub""}}"
```

Confirm the item includes:
- `user_sub`
- `tenant_id`
- `role`
- `tier`

Expected result:
- `tenant_id` matches the user’s server-side tenant assignment
- this row is authoritative for authorization

## 2. Get Token With Cognito USER_PASSWORD_AUTH
Use Cognito `initiate-auth` to get an ID/access token pair for demo calls.

```powershell
$Region = "us-east-1"
$ClientId = "4ssfq7va608hr9uolatbhsma7q"
$Username = "<demo-user-email-or-username>"
$Password = "<demo-user-password>"

$Auth = aws cognito-idp initiate-auth `
  --region $Region `
  --client-id $ClientId `
  --auth-flow USER_PASSWORD_AUTH `
  --auth-parameters USERNAME=$Username,PASSWORD=$Password | ConvertFrom-Json

$AccessToken = $Auth.AuthenticationResult.AccessToken
$IdToken = $Auth.AuthenticationResult.IdToken

$AccessToken.Length
```

If the flow is not enabled for the app client in this environment, use the environment’s supported sign-in path and substitute the resulting access token below.

## 3. `/me` Sanity Check
This proves:
- the token is valid
- the request resolves tenant scope from verified auth + entitlements
- no client-supplied tenant selector is needed

```powershell
$ApiUrl = "https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com"

Invoke-RestMethod `
  -Method GET `
  -Uri "$ApiUrl/me" `
  -Headers @{
    Authorization = "Bearer $AccessToken"
  }
```

Expected result:
- success response with fields such as `userId`, `tenantId`, `role`, and `tier`

## 4. Create Session
Valid payload must match the live validator in `session-validate.js`:
- required: `sport`, `ageBand`, `durationMin`, `activities`
- optional: `objectiveTags`, `clubId`, `teamId`, `seasonId`
- `activities` must be a non-empty array
- each activity needs `name` and integer `minutes`
- total activity minutes must be `<= durationMin`

```powershell
$SessionPayload = @{
  sport = "soccer"
  ageBand = "u14"
  durationMin = 75
  objectiveTags = @("pressing", "transition")
  activities = @(
    @{
      name = "Warm-up"
      minutes = 15
      description = "Mobility and activation"
    },
    @{
      name = "Passing Circuit"
      minutes = 20
      description = "Short passing under pressure"
    },
    @{
      name = "Small-Sided Game"
      minutes = 30
      description = "Conditioned game with transition triggers"
    }
  )
} | ConvertTo-Json -Depth 6

$CreateSession = Invoke-RestMethod `
  -Method POST `
  -Uri "$ApiUrl/sessions" `
  -Headers @{
    Authorization = "Bearer $AccessToken"
    "Content-Type" = "application/json"
  } `
  -Body $SessionPayload

$CreateSession
$SessionId = $CreateSession.session.sessionId
```

## 5. List Sessions
This confirms tenant-scoped reads for the signed-in user.

```powershell
Invoke-RestMethod `
  -Method GET `
  -Uri "$ApiUrl/sessions" `
  -Headers @{
    Authorization = "Bearer $AccessToken"
  }
```

Expected result:
- the list includes the newly created session summary

## 6. Create Pack
The `/session-packs` endpoint currently validates:
- required: `sport`, `ageBand`, `durationMin`, `theme`
- optional: `sessionsCount`

Minimal valid payload:

```powershell
$PackPayload = @{
  sport = "soccer"
  ageBand = "u14"
  durationMin = 75
  theme = "High press"
  sessionsCount = 3
} | ConvertTo-Json

Invoke-RestMethod `
  -Method POST `
  -Uri "$ApiUrl/session-packs" `
  -Headers @{
    Authorization = "Bearer $AccessToken"
    "Content-Type" = "application/json"
  } `
  -Body $PackPayload
```

If validation changes later, check:
- `services/club-vivo/api/_lib/session-pack-validate.js`
- `services/club-vivo/api/session-packs/handler.js`

## 7. Export PDF And Download It
Export the session PDF from the server-side route:

```powershell
$PdfExport = Invoke-RestMethod `
  -Method GET `
  -Uri "$ApiUrl/sessions/$SessionId/pdf" `
  -Headers @{
    Authorization = "Bearer $AccessToken"
  }

$PdfExport
```

Expected result:
- JSON response like:
  - `url`
  - `expiresInSeconds`

Download the presigned URL to a local file:

```powershell
$PdfPath = ".\session.pdf"

Invoke-WebRequest `
  -Uri $PdfExport.url `
  -OutFile $PdfPath

Get-Item $PdfPath
```

Notes:
- the presigned URL is time-limited
- the S3 key is derived server-side from tenant context plus `sessionId`
- no client `tenant_id` is involved

## 8. Cross-Tenant Negative Checks
Sign in as a second user from a different tenant.

```powershell
$Username2 = "<second-user-email-or-username>"
$Password2 = "<second-user-password>"

$Auth2 = aws cognito-idp initiate-auth `
  --region $Region `
  --client-id $ClientId `
  --auth-flow USER_PASSWORD_AUTH `
  --auth-parameters USERNAME=$Username2,PASSWORD=$Password2 | ConvertFrom-Json

$AccessToken2 = $Auth2.AuthenticationResult.AccessToken
```

Attempt to fetch the first tenant’s session:

```powershell
try {
  Invoke-RestMethod `
    -Method GET `
    -Uri "$ApiUrl/sessions/$SessionId" `
    -Headers @{
      Authorization = "Bearer $AccessToken2"
    }
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Attempt to export the first tenant’s session PDF:

```powershell
try {
  Invoke-RestMethod `
    -Method GET `
    -Uri "$ApiUrl/sessions/$SessionId/pdf" `
    -Headers @{
      Authorization = "Bearer $AccessToken2"
    }
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected result:
- access fails with `404` or `403`
- no cross-tenant session data is returned

## 9. Troubleshooting
| Status | Meaning | What to check |
|---|---|---|
| `400` | Validation or malformed request | Check payload shape, required fields, integer types, activity minutes, and JSON syntax. Review request body against `session-validate.js` or `session-pack-validate.js`. |
| `401` | Token invalid, expired, or missing | Confirm the bearer token is current, issued by the correct user pool/app client, and passed in the `Authorization` header. |
| `403` | Authenticated but not authorized | Check the entitlements row in `sic-tenant-entitlements-dev`. Confirm `user_sub`, `tenant_id`, `role`, and `tier` exist and are valid. |
| `404` | Resource not found in tenant scope | Confirm the `sessionId` exists for the current signed-in tenant. Cross-tenant lookups should fail this way. |
| `500` | Server/config issue | Check Lambda logs, missing env vars, downstream AWS dependency issues, and recent infra changes. |

## 10. Fast Demo Sequence
For a live 5-minute walkthrough:
1. Get an access token.
2. Run `/me`.
3. Create one session and copy the returned `sessionId`.
4. List sessions and show the new one.
5. Generate a session pack.
6. Export the session PDF and download it.
7. Switch to a second token and show that session read/PDF export fails across tenants.

## Security Reminder
All Club Vivo demo calls must respect the tenancy contract:
- authenticate with a valid token
- authorize from the entitlements store
- never send `tenant_id` from the client
- expect fail-closed behavior when entitlements are missing or tenant scope does not match
