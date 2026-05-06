import "server-only";

import type { CurrentUser } from "./get-current-user";

type WorkspaceCookieScope = Pick<CurrentUser, "tenantId" | "userId">;

function encodeCookieNamePart(value: string) {
  return encodeURIComponent(value.trim() || "unknown");
}

export function getWorkspaceCookieName(baseName: string, scope: WorkspaceCookieScope) {
  return [
    baseName,
    encodeCookieNamePart(scope.tenantId),
    encodeCookieNamePart(scope.userId)
  ].join(".");
}
