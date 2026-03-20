# Repo Public Safety Runbook (SIC)

## Goal
Make the SIC repository safe for public sharing:
- No credentials/secrets
- No real AWS account IDs, Cognito IDs, client IDs
- No real API Gateway IDs
- No real user identifiers in notes
- No sensitive identifiers in git history

## Required checks (current state)
Run from repo root:

### Secrets / keys
- `git grep -n -I "BEGIN PRIVATE KEY\|BEGIN RSA PRIVATE KEY\|BEGIN OPENSSH PRIVATE KEY\|BEGIN CERTIFICATE"`
- `git grep -n -I "AKIA[0-9A-Z]\{16\}\|ASIA[0-9A-Z]\{16\}\|aws_secret_access_key\|aws_access_key_id\|AWS_SECRET_ACCESS_KEY\|AWS_ACCESS_KEY_ID"`
- `git grep -n -I -E -- "-----BEGIN|PRIVATE KEY|xoxb-|ghp_|github_pat_|AIza|sk-[A-Za-z0-9]{20,}"`

### Identifiers
- `git grep -n -I -E "\b[0-9]{12}\b|arn:aws:iam::[0-9]{12}:"`
- `git grep -n -I -E "\bus-[a-z]+-[0-9]_[A-Za-z0-9]+\b|client_id|app client|amazoncognito.com"`
- API Gateway ID pattern check:
  `git log -p -G "https://[a-z0-9]{10}\.execute-api\." origin/main -- .`

## Required checks (history)
- `git log -p -S "<sensitive-string>" origin/main -- .`
If any output appears, history still contains the value.

## How to sanitize history
1) Add replace rules to `replace.txt` (format: `OLD==>NEW`)
2) Run: `git filter-repo --force --replace-text replace.txt`
3) Re-add remote (filter-repo removes it): `git remote add origin <url>`
4) Force-push: `git push --force origin main`
5) Verify on origin: `git log -p -S "<sensitive-string>" origin/main -- .`

## Notes
- `infra/cdk/cdk.out/` must remain ignored (generated synth output often contains account IDs and ARNs).
- Documentation examples must use placeholders: `<api-id>`, `<region>`, `<redacted-account-id>`, `<JWT>`.