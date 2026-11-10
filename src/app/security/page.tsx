"use client";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { SecuritySettings } from "@/components/operations/security-settings";

export default function SecurityPage() {
  return <ProtectedLayout><main className="screen-body"><SecuritySettings /></main></ProtectedLayout>;
}
