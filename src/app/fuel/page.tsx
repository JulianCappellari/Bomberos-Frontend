"use client";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { FleetScreen } from "@/components/operations/fleet-screen";
export default function FuelPage() { return <ProtectedLayout><FleetScreen kind="fuel" /></ProtectedLayout>; }
