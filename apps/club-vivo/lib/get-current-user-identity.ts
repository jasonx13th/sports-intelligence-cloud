import "server-only";

import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  IDENTITY_COOKIE,
  getDisplayIdentityFromAccessToken,
  getDisplayIdentityFromJwt
} from "./auth";

export async function getCurrentUserIdentity() {
  const cookieStore = await cookies();
  const identityToken = cookieStore.get(IDENTITY_COOKIE)?.value;
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (identityToken) {
    return getDisplayIdentityFromJwt(identityToken);
  }

  if (accessToken) {
    return getDisplayIdentityFromAccessToken(accessToken);
  }

  return null;
}
