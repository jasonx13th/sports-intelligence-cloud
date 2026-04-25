import { NextRequest, NextResponse } from "next/server";

import {
  buildAuthorizeUrl,
  buildFreshSignInUrl,
  clearSessionCookies,
  setTemporaryAuthCookies
} from "../../../lib/auth";
import {
  createCodeChallenge,
  generateCodeVerifier,
  generateState
} from "../../../lib/pkce";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "signin";
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const response = NextResponse.redirect(
    mode === "signup"
      ? buildAuthorizeUrl({ state, codeChallenge, mode })
      : buildFreshSignInUrl({ state, codeChallenge })
  );

  if (mode === "signin") {
    clearSessionCookies(response);
  }
  setTemporaryAuthCookies(response, { state, codeVerifier });

  return response;
}
