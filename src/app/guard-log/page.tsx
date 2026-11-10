"use client";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { DocumentsScreen } from "@/components/operations/documents-screen";
export default function GuardLogPage() { return <ProtectedLayout><DocumentsScreen guardLog /></ProtectedLayout>; }
