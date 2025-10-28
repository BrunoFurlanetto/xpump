"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Registrar o service worker e verificar por atualizações
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        setRegistration(reg);

        // Verificar por atualizações a cada 1 hora
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

        // Detectar quando há um novo service worker esperando
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // Novo service worker disponível
                console.log("Nova versão do app disponível!");
                setShowUpdatePrompt(true);
              }
            });
          }
        });

        // Verificar se há um service worker esperando imediatamente
        if (reg.waiting) {
          setShowUpdatePrompt(true);
        }
      });

      // Ouvir mensagens do service worker
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker atualizado, recarregando página...");
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Enviar mensagem para o service worker pular a espera
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setShowUpdatePrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-card border border-primary/20 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Nova Versão Disponível!</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Uma nova versão do X-Pump está pronta. Atualize para ter acesso às últimas melhorias.
            </p>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate} className="flex-1">
                Atualizar Agora
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Depois
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
