import "server-only";

import { NextResponse } from "next/server";

export const ACCESS_COOKIE = "sic_access_token";
export const IDENTITY_COOKIE = "sic_identity_token";
export const AUTH_STATE_COOKIE = "sic_auth_state";
export const PKCE_VERIFIER_COOKIE = "sic_pkce_verifier";
const HOSTED_AUTH_SCOPE = "openid email aws.cognito.signin.user.admin";

type AuthConfig = {
  apiUrl: string;
  cognitoDomain: string;
  webClientId: string;
  redirectUri: string;
  logoutUri: string;
};

type ExchangeCodeOptions = {
  code: string;
  codeVerifier: string;
};

type TokenExchangeResult = {
  accessToken: string;
  idToken?: string;
  expiresIn?: number;
};

function requireEnvVar(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getRequiredAuthConfig(): AuthConfig {
  return {
    apiUrl: requireEnvVar("CLUB_VIVO_API_URL"),
    cognitoDomain: normalizeBaseUrl(requireEnvVar("CLUB_VIVO_COGNITO_DOMAIN")),
    webClientId: requireEnvVar("CLUB_VIVO_WEB_CLIENT_ID"),
    redirectUri: requireEnvVar("CLUB_VIVO_REDIRECT_URI"),
    logoutUri: requireEnvVar("CLUB_VIVO_LOGOUT_URI")
  };
}

export function buildAuthorizeUrl({
  state,
  codeChallenge,
  mode = "signin"
}: {
  state: string;
  codeChallenge: string;
  mode?: "signin" | "signup";
}) {
  const config = getRequiredAuthConfig();
  const path = mode === "signup" ? "signup" : "oauth2/authorize";
  const url = new URL(path, config.cognitoDomain);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.webClientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", HOSTED_AUTH_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", codeChallenge);

  return url;
}

export function buildFreshSignInUrl({
  state,
  codeChallenge
}: {
  state: string;
  codeChallenge: string;
}) {
  const config = getRequiredAuthConfig();
  const url = new URL("logout", config.cognitoDomain);

  url.searchParams.set("client_id", config.webClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", HOSTED_AUTH_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", codeChallenge);

  return url;
}

export async function exchangeAuthorizationCode({
  code,
  codeVerifier
}: ExchangeCodeOptions): Promise<TokenExchangeResult | null> {
  const config = getRequiredAuthConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.webClientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch(new URL("oauth2/token", config.cognitoDomain), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: body.toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    access_token?: string;
    id_token?: string;
    expires_in?: number;
  };

  if (typeof payload.access_token !== "string" || payload.access_token.length === 0) {
    return null;
  }

  return {
    accessToken: payload.access_token,
    ...(typeof payload.id_token === "string" && payload.id_token.length > 0
      ? { idToken: payload.id_token }
      : {}),
    expiresIn: typeof payload.expires_in === "number" ? payload.expires_in : undefined
  };
}

export function setTemporaryAuthCookies(
  response: NextResponse,
  {
    state,
    codeVerifier
  }: {
    state: string;
    codeVerifier: string;
  }
) {
  response.cookies.set({
    name: AUTH_STATE_COOKIE,
    value: state,
    maxAge: 600,
    ...getCookieOptions()
  });

  response.cookies.set({
    name: PKCE_VERIFIER_COOKIE,
    value: codeVerifier,
    maxAge: 600,
    ...getCookieOptions()
  });
}

export function setAccessTokenCookie(
  response: NextResponse,
  {
    accessToken,
    expiresIn
  }: {
    accessToken: string;
    expiresIn?: number;
  }
) {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: accessToken,
    ...(typeof expiresIn === "number" ? { maxAge: expiresIn } : {}),
    ...getCookieOptions()
  });
}

export function setIdentityTokenCookie(
  response: NextResponse,
  {
    idToken,
    expiresIn
  }: {
    idToken: string;
    expiresIn?: number;
  }
) {
  response.cookies.set({
    name: IDENTITY_COOKIE,
    value: idToken,
    ...(typeof expiresIn === "number" ? { maxAge: expiresIn } : {}),
    ...getCookieOptions()
  });
}

export function clearSessionCookies(response: NextResponse) {
  for (const cookieName of [ACCESS_COOKIE, IDENTITY_COOKIE]) {
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      ...getCookieOptions()
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  for (const cookieName of [ACCESS_COOKIE, IDENTITY_COOKIE, AUTH_STATE_COOKIE, PKCE_VERIFIER_COOKIE]) {
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      ...getCookieOptions()
    });
  }
}

export function clearTemporaryAuthCookies(response: NextResponse) {
  for (const cookieName of [AUTH_STATE_COOKIE, PKCE_VERIFIER_COOKIE]) {
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      ...getCookieOptions()
    });
  }
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);

    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readTextClaim(claims: Record<string, unknown> | null, key: string) {
  const value = claims?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getDisplayNameFromEmail(email: string | null) {
  if (!email) {
    return null;
  }

  const atIndex = email.indexOf("@");
  const localPart = atIndex > 0 ? email.slice(0, atIndex).trim() : "";

  return localPart.length > 0 ? localPart : null;
}

export function getDisplayIdentityFromAccessToken(accessToken: string) {
  return getDisplayIdentityFromJwt(accessToken);
}

export function getDisplayIdentityFromJwt(token: string) {
  const claims = decodeJwtPayload(token);
  const email = readTextClaim(claims, "email");

  return (
    getDisplayNameFromEmail(email) ||
    email ||
    readTextClaim(claims, "username") ||
    readTextClaim(claims, "cognito:username") ||
    readTextClaim(claims, "sub")
  );
}
