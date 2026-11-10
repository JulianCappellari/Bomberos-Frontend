export function isNavigationActive(pathname: string, href: string) {
  if (href === "/personal-equipment" && pathname === "/equipment-requests") return true;
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
}
