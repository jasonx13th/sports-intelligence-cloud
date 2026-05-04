const ADMIN_LIKE_ROLES = new Set([
  "admin",
  "admin coach",
  "admincoach",
  "club admin",
  "club_admin"
]);

export function normalizeRole(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export function isAdminLikeRole(value: string | null | undefined) {
  return ADMIN_LIKE_ROLES.has(normalizeRole(value));
}
