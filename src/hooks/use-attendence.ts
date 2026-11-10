"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import {
  getMyAttendanceSummary,
  getPresentPersonnelRequest,
} from "@/services/attendance.service";

export function useMyAttendanceSummary() {
  return useQuery({
    queryKey: ["attendance", "me", "summary"],
    queryFn: getMyAttendanceSummary,
  });
}

export function usePresentPersonnel() {
  const { user } = useAuth(), client = useQueryClient();
  useEffect(() => {
    if (!user || user.mustChangePassword) return;
    let active = true; const controller = new AbortController();
    async function subscribe() {
      while (active) {
        try {
          const response = await fetch(`${api.defaults.baseURL}/attendance/present/events`, { headers: { Authorization: `Bearer ${getAccessToken()}` }, signal: controller.signal, cache: "no-store" });
          if (response.status === 401) { await api.get("/attendance/present"); continue; }
          if (!response.ok || !response.body) throw new Error("Subscription unavailable");
          const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = "";
          while (active) { const next = await reader.read(); if (next.done) break; buffer += decoder.decode(next.value, { stream: true }); const frames = buffer.split("\n\n"); buffer = frames.pop() || ""; for (const frame of frames) if (frame.startsWith("event: changed")) await client.invalidateQueries({ queryKey: ["attendance", "present"] }); }
        } catch { /* Polling remains a fallback when proxies do not support streams. */ }
        if (active) await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    void subscribe(); return () => { active = false; controller.abort(); };
  }, [user, client]);
  return useQuery({
    queryKey: ["attendance", "present"],
    queryFn: getPresentPersonnelRequest,
    refetchInterval: 10000,
    enabled: Boolean(user),
  });
}
