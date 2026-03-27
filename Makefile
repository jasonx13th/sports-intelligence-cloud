SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c

.PHONY: check guard test cdk-build

check: guard test cdk-build

guard:
    @printf "\n==> Tenant guardrails\n"
    @command -v rg >/dev/null 2>&1 || { echo "ripgrep (rg) is required for make guard"; exit 1; }
    @CANDIDATE_DIRS=(apps services packages src lambdas lambda backend); \
    SEARCH_DIRS=(); \
    for d in "$${CANDIDATE_DIRS[@]}"; do \
        if [[ -d "$$d" ]]; then \
            SEARCH_DIRS+=("$$d"); \
        fi; \
    done; \
    if [[ $${#SEARCH_DIRS[@]} -eq 0 ]]; then \
        echo "[tenant-guardrails] No known code roots found ($${CANDIDATE_DIRS[*]}). Skipping scan."; \
        exit 0; \
    fi; \
    echo "[tenant-guardrails] Scanning directories: $${SEARCH_DIRS[*]}"; \
    RG_EXCLUDES=( \
        --glob '!**/*.md' \
        --glob '!**/*.txt' \
        --glob '!**/*.log' \
        --glob '!**/*.pdf' \
        --glob '!**/*.png' \
        --glob '!**/*.jpg' \
        --glob '!**/*.jpeg' \
        --glob '!**/*.gif' \
        --glob '!**/*.svg' \
        --glob '!**/*.lock' \
        --glob '!**/node_modules/**' \
        --glob '!**/dist/**' \
        --glob '!**/build/**' \
        --glob '!**/.next/**' \
        --glob '!**/.turbo/**' \
        --glob '!**/.serverless/**' \
        --glob '!**/coverage/**' \
        --glob '!**/__tests__/**' \
        --glob '!**/test/**' \
        --glob '!**/tests/**' \
        --glob '!**/*.test.*' \
        --glob '!**/*.spec.*' \
    ); \
    BANNED_PATTERNS=( \
        'x-tenant-id' \
        'x_tenant_id' \
        'tenant_id[[:space:]]*\\((headers|query|body)\\)' \
        'tenantId[[:space:]]*\\((headers|query|body)\\)' \
        'queryStringParameters\\.(tenant_id|tenantId)' \
        'queryStringParameters\\[["'\''](tenant_id|tenantId)["'\'']\\]' \
        'event\\.queryStringParameters\\.(tenant_id|tenantId)' \
        'event\\.queryStringParameters\\[["'\''](tenant_id|tenantId)["'\'']\\]' \
        'headers\\.(tenant_id|tenantId)' \
        'headers\\[["'\''](x-tenant-id|x_tenant_id|tenant_id|tenantId)["'\'']\\]' \
        'event\\.headers\\.(tenant_id|tenantId)' \
        'event\\.headers\\[["'\''](x-tenant-id|x_tenant_id|tenant_id|tenantId)["'\'']\\]' \
        'body\\.(tenant_id|tenantId)' \
        'body\\[["'\''](tenant_id|tenantId)["'\'']\\]' \
        'req\\.body\\.(tenant_id|tenantId)' \
        'req\\.body\\[["'\''](tenant_id|tenantId)["'\'']\\]' \
        'req\\.query\\.(tenant_id|tenantId)' \
        'req\\.query\\[["'\''](tenant_id|tenantId)["'\'']\\]' \
        'req\\.get\\((["'\''])(x-tenant-id|x_tenant_id|tenant_id|tenantId)\1\\)' \
        'request\\.headers\\.get\\((["'\''])(x-tenant-id|x_tenant_id|tenant_id|tenantId)\1\\)' \
    ); \
    for pat in "$${BANNED_PATTERNS[@]}"; do \
        if rg -n -I -S "$${RG_EXCLUDES[@]}" -e "$$pat" "$${SEARCH_DIRS[@]}"; then \
            echo ""; \
            echo "[tenant-guardrails] ERROR: Found banned pattern: $$pat"; \
            exit 1; \
        fi; \
    done; \
    echo "[tenant-guardrails] Passed."

test:
    @printf "\n==> Service unit tests\n"
    @printf "\n--> services/auth/post-confirmation\n"
    @npm test --prefix services/auth/post-confirmation
    @printf "\n--> services/club-vivo/api\n"
    @npm test --prefix services/club-vivo/api

cdk-build:
    @printf "\n==> CDK build\n"
    @npm run build --prefix infra/cdk