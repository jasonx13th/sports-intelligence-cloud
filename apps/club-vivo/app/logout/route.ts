import { NextRequest, NextResponse } from "next/server";

import { buildAppUrl, clearAuthCookies } from "../../lib/auth";

export async function GET(_request: NextRequest) {
  const response = NextResponse.redirect(buildAppUrl("/login?loggedOut=1"));
  clearAuthCookies(response);

  return response;
}
