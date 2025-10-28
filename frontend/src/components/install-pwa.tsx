"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Verificar se usuário já dispensou o banner antes
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallBanner(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Instalar X-Pump</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Instale nosso app para acesso rápido e experiência completa, mesmo offline!
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="flex-1"
            >
              Instalar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            >
              Agora não
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
