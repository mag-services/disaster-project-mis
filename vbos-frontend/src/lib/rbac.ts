import type { AuthUser } from "@/store/auth-store";

export type AppRole = "admin" | "analyst" | "field_officer" | "read_only";
export type ShellNavId = "dashboard" | "live-map" | "datasets" | "exports" | "audit" | "settings";

export function getUserRole(user: AuthUser | null | undefined): AppRole {
  if (!user) return "analyst";
  if (user.role) return user.role;
  if (user.is_superuser || user.is_staff) return "admin";

  const groups = new Set((user.groups ?? []).map((g) => g.toLowerCase()));
  if (groups.has("field_officer") || groups.has("field officer") || groups.has("field-officer")) {
    return "field_officer";
  }
  if (groups.has("read_only") || groups.has("readonly") || groups.has("read only") || groups.has("viewer")) {
    return "read_only";
  }
  return "analyst";
}

export function canAccessShellNav(role: AppRole, navId: string): navId is ShellNavId {
  if (navId === "live-map") return true;
  if (role === "admin") {
    return ["dashboard", "live-map", "datasets", "exports", "audit", "settings"].includes(navId);
  }
  if (role === "analyst" || role === "read_only") {
    return ["dashboard", "live-map", "datasets", "exports", "audit"].includes(navId);
  }
  if (role === "field_officer") {
    return ["dashboard", "live-map"].includes(navId);
  }
  return false;
}

export function canAccessDataEntry(role: AppRole): boolean {
  return role === "admin" || role === "analyst" || role === "field_officer";
}
