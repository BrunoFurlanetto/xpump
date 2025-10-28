"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Verificar se já está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    // Handler para o evento beforeinstallprompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Verificar se usuário já dispensou o banner antes
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      const dismissedDate = localStorage.getItem("pwa-install-dismissed-date");

      // Mostrar novamente após 7 dias se foi dispensado
      if (dismissed && dismissedDate) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed > 7) {
          localStorage.removeItem("pwa-install-dismissed");
          localStorage.removeItem("pwa-install-dismissed-date");
          setShowInstallBanner(true);
        }
      } else if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Verificar se foi instalado
    window.addEventListener("appinstalled", () => {
      console.log("PWA foi instalado com sucesso!");
      setShowInstallBanner(false);
      setIsInstalled(true);
      localStorage.setItem("pwa-installed", "true");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to the install prompt: ${outcome}`);

    if (outcome === "accepted") {
      setShowInstallBanner(false);
      localStorage.setItem("pwa-installed", "true");
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
    localStorage.setItem("pwa-install-dismissed-date", Date.now().toString());
  };

  // Não mostrar se já estiver instalado
  if (isInstalled) return null;

  // Banner para iOS (instruções manuais)
  if (isIOS && !showInstallBanner) {
    const iosInstructionsDismissed = localStorage.getItem("ios-install-instructions-dismissed");
    if (iosInstructionsDismissed) return null;

    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div className="bg-card border rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Instalar X-Pump no iOS</h3>
              <p className="text-xs text-muted-foreground mb-2">Para instalar o app no seu iPhone/iPad:</p>
              <ol className="text-xs text-muted-foreground space-y-1 mb-3 list-decimal list-inside">
                <li>Toque no ícone de compartilhar (📤)</li>
                <li>Role e selecione &quot;Adicionar à Tela Inicial&quot;</li>
                <li>Toque em &quot;Adicionar&quot;</li>
              </ol>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  localStorage.setItem("ios-install-instructions-dismissed", "true");
                  window.location.reload();
                }}
                className="w-full"
              >
                Entendi
              </Button>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("ios-install-instructions-dismissed", "true");
                window.location.reload();
              }}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner normal de instalação (Android/Desktop)
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
            <Button size="sm" onClick={handleInstallClick} className="flex-1">
              Instalar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
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
