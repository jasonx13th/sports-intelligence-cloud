import { NextRequest, NextResponse } from "next/server";

import { buildAppUrl, clearAuthCookies } from "../../lib/auth";

export async function GET(_request: NextRequest) {
  const response = NextResponse.redirect(buildAppUrl("/"));
  clearAuthCookies(response);

  return response;
}
