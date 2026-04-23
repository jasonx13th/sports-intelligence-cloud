import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE } from "./auth";
import { buildApiUrl } from "./api";

export const METHODOLOGY_SCOPES = ["shared", "travel", "ost"] as const;

export type MethodologyScope = (typeof METHODOLOGY_SCOPES)[number];
export type MethodologyStatus = "draft" | "published";

export type MethodologyRecord = {
  scope: MethodologyScope;
  title: string;
  content: string;
  status: MethodologyStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class MethodologyApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "MethodologyApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isMethodologyRecord(value: unknown): value is MethodologyRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.scope === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

async function getAccessToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  return accessToken;
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken();
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (response.status === 401) {
    redirect("/logout");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new MethodologyApiError("Expected JSON response", response.status);
  }

  const body = (await response.json()) as T | ErrorEnvelope;

  if (!response.ok) {
    const errorBody = body as ErrorEnvelope;
    throw new MethodologyApiError(
      errorBody.error?.message || `Methodology API request failed (${response.status})`,
      response.status,
      errorBody.error?.code,
      errorBody.error?.details
    );
  }

  return body as T;
}

export async function getMethodology(scope: MethodologyScope) {
  const result = await requestJson<{
    methodology: MethodologyRecord;
  }>(`/methodology/${encodeURIComponent(scope)}`);

  if (!isMethodologyRecord(result.methodology)) {
    throw new MethodologyApiError("Invalid methodology response", 500);
  }

  return result.methodology;
}

export async function saveMethodology(
  scope: MethodologyScope,
  input: {
    title: string;
    content: string;
  }
) {
  const result = await requestJson<{
    methodology: MethodologyRecord;
  }>(`/methodology/${encodeURIComponent(scope)}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });

  if (!isMethodologyRecord(result.methodology)) {
    throw new MethodologyApiError("Invalid methodology response", 500);
  }

  return result.methodology;
}

export async function publishMethodology(scope: MethodologyScope) {
  const result = await requestJson<{
    methodology: MethodologyRecord;
  }>(`/methodology/${encodeURIComponent(scope)}/publish`, {
    method: "POST",
    body: JSON.stringify({})
  });

  if (!isMethodologyRecord(result.methodology)) {
    throw new MethodologyApiError("Invalid methodology response", 500);
  }

  return result.methodology;
}
