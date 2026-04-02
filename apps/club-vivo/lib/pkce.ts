import "server-only";

import { createHash, randomBytes } from "node:crypto";

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateState() {
  return toBase64Url(randomBytes(32));
}

export function generateCodeVerifier() {
  return toBase64Url(randomBytes(64));
}

export function createCodeChallenge(codeVerifier: string) {
  return toBase64Url(createHash("sha256").update(codeVerifier).digest());
}
