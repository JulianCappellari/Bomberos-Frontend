"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { persistOfflineCache, restoreOfflineCache } from "@/lib/offline-cache";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => {
    const created = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
          // Sin señal se muestran los datos guardados en vez de quedar cargando.
          networkMode: "offlineFirst",
        },
      },
    });
    if (typeof window !== "undefined") restoreOfflineCache(created);
    return created;
  });
  useEffect(() => persistOfflineCache(client), [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}