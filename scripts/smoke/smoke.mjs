/**
 * Integration smoke tests (dev/stage).
 *
 * Env:
 *  - BASE_URL: e.g. https://<api-id>.execute-api.us-east-1.amazonaws.com
 *  - TOKEN: Bearer token (JWT) for an authorized user
 *
 * Tenancy:
 *  - Never send tenant_id / x-tenant-id. Tenant scope must come from auth context only.
 */
const baseUrl = process.env.BASE_URL;
const token = process.env.TOKEN;

if (!baseUrl) {
  console.error("Missing BASE_URL");
  process.exit(2);
}
if (!token) {
  console.error("Missing TOKEN");
  process.exit(2);
}

const authHeaders = {
  authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
  "content-type": "application/json",
};

async function req(method, path, { headers, body } = {}) {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { url, status: res.status, text, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const start = Date.now();

  // 1) Auth success: /me should be 200 with a valid token
  const me = await req("GET", "/me", { headers: authHeaders });

  // 2) Auth required: /me with NO token should be 401/403 (authorizer-dependent)
  const meNoAuth = await req("GET", "/me", { headers: { "content-type": "application/json" } });

  // 3) Unknown route should be 404
  const missing = await req("GET", "/__smoke_does_not_exist__", { headers: authHeaders });

  assert(me.status === 200, `Expected GET /me 200, got ${me.status}`);

  // Allow 401 or 403 depending on auth configuration
  assert(
    meNoAuth.status === 401 || meNoAuth.status === 403,
    `Expected GET /me (no auth) 401/403, got ${meNoAuth.status}`
  );

  assert(missing.status === 404, `Expected unknown route 404, got ${missing.status}`);

  const ms = Date.now() - start;
  console.log(`[smoke] PASS in ${ms}ms`);
}

main().catch((err) => {
  console.error("[smoke] FAIL:", err.message);
  process.exit(1);
});
