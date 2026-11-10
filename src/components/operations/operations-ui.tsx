import { ReactNode } from "react";
import { UserRosterItem } from "@/types/user";

export function personName(user?: UserRosterItem | null) {
  return user?.profile?.fullName || user?.username || "Sin asignar";
}
export function isManager(role?: string) { return role === "ADMIN" || role === "OPERATOR"; }
export function stationDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0"><span className="app-label">{label}</span>{children}</label>;
}
export function ErrorNotice({ children }: { children: ReactNode }) {
  return <div role="alert" className="my-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{children}</div>;
}
export function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border-l-2 border-[var(--bord)] pl-3"><div className="text-2xl font-bold text-white">{value}</div><div className="text-xs text-[var(--mut)]">{label}</div></div>;
}
export function StateBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const colors = { neutral: "border-white/15 bg-white/5 text-white/75", good: "border-green-500/30 bg-green-500/10 text-green-200", warning: "border-amber-500/30 bg-amber-500/10 text-amber-200", danger: "border-red-500/30 bg-red-500/10 text-red-200" };
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>;
}
