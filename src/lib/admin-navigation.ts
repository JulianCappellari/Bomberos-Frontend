export const adminAreas = ["overview", "staff", "operations", "finance", "audit"] as const;
export const staffViews = ["profile", "permissions", "statistics", "clothing", "security"] as const;
export type AdminArea = typeof adminAreas[number];
export type StaffView = typeof staffViews[number];
export type AdminLocation = { area: AdminArea; person: string; view: StaffView };
export function parseAdminLocation(search: string): AdminLocation {
  const params = new URLSearchParams(search);
  return { area: adminAreas.includes(params.get("area") as AdminArea) ? params.get("area") as AdminArea : "overview", person: params.get("person") || "", view: staffViews.includes(params.get("view") as StaffView) ? params.get("view") as StaffView : "profile" };
}
export function adminHref(location: AdminLocation) {
  const params = new URLSearchParams({ area: location.area });
  if (location.person && location.area === "staff") { params.set("person", location.person); params.set("view", location.view); }
  return `/admin?${params}`;
}
