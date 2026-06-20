import type { AdminRole } from "@prisma/client";

export type AdminPermission =
  | "fees:read"
  | "fees:write"
  | "points:read"
  | "points:write"
  | "users:read"
  | "users:write"
  | "tokens:read"
  | "tokens:write"
  | "analytics:read"
  | "settings:read"
  | "settings:write"
  | "admins:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    "fees:read",
    "fees:write",
    "points:read",
    "points:write",
    "users:read",
    "users:write",
    "tokens:read",
    "tokens:write",
    "analytics:read",
    "settings:read",
    "settings:write",
    "admins:manage",
    "audit:read"
  ],
  ADMIN: [
    "fees:read",
    "fees:write",
    "points:read",
    "points:write",
    "users:read",
    "users:write",
    "tokens:read",
    "tokens:write",
    "analytics:read",
    "settings:read",
    "settings:write",
    "audit:read"
  ],
  MODERATOR: [
    "points:read",
    "points:write",
    "users:read",
    "users:write",
    "analytics:read",
    "audit:read"
  ]
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "MODERATOR":
      return "Moderator";
    default:
      return role;
  }
}
