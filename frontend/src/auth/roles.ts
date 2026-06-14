export type TenantRole = "owner" | "admin" | "member" | "viewer";

export function canManageCatalog(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canCreateStockMovement(role?: string | null) {
  return role === "owner" || role === "admin" || role === "member";
}

export function canManageAdjustments(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canViewAuditLogs(role?: string | null) {
  return role === "owner" || role === "admin";
}
