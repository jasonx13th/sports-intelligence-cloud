import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { ACCESS_COOKIE } from "./auth";

export const SELECTED_TEAM_COOKIE = "sic_selected_team";

type SelectedTeamPayload = {
  teamId: string;
  tenantId: string;
  version: 1;
};

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  };
}

function encodePayload(payload: SelectedTeamPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== 1 ||
      typeof parsed.teamId !== "string" ||
      !parsed.teamId.trim() ||
      typeof parsed.tenantId !== "string" ||
      !parsed.tenantId.trim()
    ) {
      return null;
    }

    return parsed as SelectedTeamPayload;
  } catch {
    return null;
  }
}

async function getSigningSecret() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const configuredSecret = process.env.CLUB_VIVO_SELECTED_TEAM_COOKIE_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (accessToken) {
    return accessToken;
  }

  throw new Error("Unable to derive a selected-team cookie signing secret");
}

async function signValue(value: string) {
  const signingSecret = await getSigningSecret();
  return createHmac("sha256", signingSecret).update(value).digest("base64url");
}

export async function readSelectedTeamId(tenantId: string) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SELECTED_TEAM_COOKIE)?.value;

  if (!cookieValue) {
    return null;
  }

  const [encodedPayload, encodedSignature] = cookieValue.split(".");
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload);
  const providedSignatureBuffer = Buffer.from(encodedSignature, "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload || payload.tenantId !== tenantId) {
    return null;
  }

  return payload.teamId;
}

export async function setSelectedTeamId({
  teamId,
  tenantId
}: {
  teamId: string;
  tenantId: string;
}) {
  const cookieStore = await cookies();
  const encodedPayload = encodePayload({
    teamId,
    tenantId,
    version: 1
  });
  const encodedSignature = await signValue(encodedPayload);

  cookieStore.set(SELECTED_TEAM_COOKIE, `${encodedPayload}.${encodedSignature}`, getCookieOptions());
}

export async function clearSelectedTeamId() {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_TEAM_COOKIE, "", {
    ...getCookieOptions(),
    maxAge: 0
  });
}
