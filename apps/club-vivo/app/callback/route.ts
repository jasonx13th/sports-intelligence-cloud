import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_STATE_COOKIE,
  PKCE_VERIFIER_COOKIE,
  buildAppUrl,
  clearAuthCookies,
  clearTemporaryAuthCookies,
  exchangeAuthorizationCode,
  setAccessTokenCookie,
  setIdentityTokenCookie
} from "../../lib/auth";
import { apiGet } from "../../lib/api";
import { isAdminLikeRole } from "../../lib/roles";

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearAuthCookies(response);
  return response;
}

async function getPostLoginPath(accessToken: string) {
  const response = await apiGet<{ ok?: boolean; role?: unknown }>("/me", {
    accessToken
  });

  if (
    response.status === 200 &&
    response.body &&
    typeof response.body === "object" &&
    typeof response.body.role === "string" &&
    isAdminLikeRole(response.body.role)
  ) {
    return "/club";
  }

  return "/home";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");

  if (!code || !returnedState) {
    return redirectToLogin(request);
  }

  const expectedState = request.cookies.get(AUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(PKCE_VERIFIER_COOKIE)?.value;

  if (!expectedState || !codeVerifier || returnedState !== expectedState) {
    return redirectToLogin(request);
  }

  try {
    const tokenResult = await exchangeAuthorizationCode({
      code,
      codeVerifier
    });

    if (!tokenResult) {
      return redirectToLogin(request);
    }

    const response = NextResponse.redirect(buildAppUrl(await getPostLoginPath(tokenResult.accessToken)));

    setAccessTokenCookie(response, {
      accessToken: tokenResult.accessToken,
      expiresIn: tokenResult.expiresIn
    });
    if (tokenResult.idToken) {
      setIdentityTokenCookie(response, {
        idToken: tokenResult.idToken,
        expiresIn: tokenResult.expiresIn
      });
    }
    clearTemporaryAuthCookies(response);

    return response;
  } catch {
    return redirectToLogin(request);
  }
}
