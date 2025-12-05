"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto - dados são considerados "frescos" por 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos - cache permanece em memória por 5 minutos
            refetchOnWindowFocus: false, // Não revalidar ao focar na janela (pode habilitar se preferir)
            retry: 1, // Tentar novamente 1 vez em caso de erro
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
