import { NextResponse } from "next/server";

import { buildAuthorizeUrl, setTemporaryAuthCookies } from "../../../lib/auth";
import {
  createCodeChallenge,
  generateCodeVerifier,
  generateState
} from "../../../lib/pkce";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const response = NextResponse.redirect(buildAuthorizeUrl({ state, codeChallenge }));

  setTemporaryAuthCookies(response, { state, codeVerifier });

  return response;
}
