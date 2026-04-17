import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_STATE_COOKIE,
  PKCE_VERIFIER_COOKIE,
  clearAuthCookies,
  clearTemporaryAuthCookies,
  exchangeAuthorizationCode,
  setAccessTokenCookie
} from "../../lib/auth";

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearAuthCookies(response);
  return response;
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

    const response = NextResponse.redirect(new URL("/sessions/new", request.url));

    setAccessTokenCookie(response, {
      accessToken: tokenResult.accessToken,
      expiresIn: tokenResult.expiresIn
    });
    clearTemporaryAuthCookies(response);

    return response;
  } catch {
    return redirectToLogin(request);
  }
}
