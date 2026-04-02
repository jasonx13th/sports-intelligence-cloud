import "server-only";

type ApiGetOptions = {
  accessToken: string;
};

function requireApiBaseUrl() {
  const baseUrl = process.env.CLUB_VIVO_API_URL;

  if (!baseUrl) {
    throw new Error("CLUB_VIVO_API_URL is not configured");
  }

  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(normalizedPath, requireApiBaseUrl()).toString();
}

export async function apiGet<T>(path: string, { accessToken }: ApiGetOptions) {
  const response = await fetch(buildApiUrl(path), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") || "";
  let body: T | string | null = null;

  if (contentType.includes("application/json")) {
    body = (await response.json()) as T;
  } else if (response.status !== 204) {
    body = await response.text();
  }

  return {
    status: response.status,
    body
  };
}
