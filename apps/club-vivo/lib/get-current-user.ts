import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiGet } from "./api";

const ACCESS_COOKIE = "sic_access_token";

export type CurrentUser = {
  ok: true;
  userId: string;
  tenantId: string;
  role: string;
  tier: string;
};

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
  };
  correlationId?: string;
  requestId?: string;
};

function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.ok === true &&
    typeof candidate.userId === "string" &&
    typeof candidate.tenantId === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.tier === "string"
  );
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const response = await apiGet<CurrentUser | ErrorEnvelope>("/me", {
    accessToken
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/logout");
  }

  if (response.status !== 200 || !isCurrentUser(response.body)) {
    throw new Error("Failed to load current user");
  }

  return response.body;
}
