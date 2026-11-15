"use client";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { SecuritySettings } from "@/components/operations/security-settings";

export default function SecurityPage() {
  return <ProtectedLayout><div className="screen-body"><SecuritySettings /></div></ProtectedLayout>;
}
