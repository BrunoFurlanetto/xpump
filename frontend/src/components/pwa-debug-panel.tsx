"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw, Trash2 } from "lucide-react";

interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  hasServiceWorker: boolean;
  hasNotificationPermission: boolean;
  notificationPermission: NotificationPermission;
  isOnline: boolean;
  platform: string;
}

export function PWADebugPanel() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    hasNotificationPermission: false,
    notificationPermission: "default",
    isOnline: true,
    platform: "unknown",
  });

  const [caches, setCaches] = useState<string[]>([]);
  const [swVersion, setSWVersion] = useState<string>("Desconhecida");

  useEffect(() => {
    checkPWAStatus();
    listCaches();
    checkSWVersion();
  }, []);

  const checkPWAStatus = () => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const hasServiceWorker = "serviceWorker" in navigator;
    const notificationPermission = "Notification" in window ? Notification.permission : "default";
    const isOnline = navigator.onLine;
    const platform = navigator.userAgent;

    setStatus({
      isInstalled: isStandalone || isIOSStandalone,
      isStandalone: isStandalone || isIOSStandalone,
      hasServiceWorker,
      hasNotificationPermission: notificationPermission === "granted",
      notificationPermission,
      isOnline,
      platform,
    });
  };

  const listCaches = async () => {
    if ("caches" in window) {
      const cacheNames = await window.caches.keys();
      setCaches(cacheNames);
    }
  };

  const checkSWVersion = async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        setSWVersion("v2.0 (Ativo)");
      }
    }
  };

  const clearAllCaches = async () => {
    if ("caches" in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
      await listCaches();
      alert("Todos os caches foram limpos!");
    }
  };

  const clearSpecificCache = async (cacheName: string) => {
    if ("caches" in window) {
      await window.caches.delete(cacheName);
      await listCaches();
      alert(`Cache "${cacheName}" foi limpo!`);
    }
  };

  const unregisterSW = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      alert("Service Worker desregistrado!");
      window.location.reload();
    }
  };

  const testNotification = async () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("X-Pump - Teste", {
          body: "Esta é uma notificação de teste!",
          icon: "/logo/x192x192.png",
          badge: "/logo/x192x192.png",
        });
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification("X-Pump - Teste", {
            body: "Notificações ativadas com sucesso!",
            icon: "/logo/x192x192.png",
          });
          checkPWAStatus();
        }
      }
    }
  };

  const StatusBadge = ({ condition }: { condition: boolean }) =>
    condition ? (
      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
        <Check className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="destructive">
        <X className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    );

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>🛠️ PWA Debug Panel</CardTitle>
        <CardDescription>Status e controles do Progressive Web App</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">App Instalado</span>
              <StatusBadge condition={status.isInstalled} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Modo Standalone</span>
              <StatusBadge condition={status.isStandalone} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Service Worker</span>
              <StatusBadge condition={status.hasServiceWorker} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Notificações</span>
              <Badge
                variant={
                  status.notificationPermission === "granted"
                    ? "default"
                    : status.notificationPermission === "denied"
                    ? "destructive"
                    : "secondary"
                }
              >
                {status.notificationPermission}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status de Rede</span>
              <StatusBadge condition={status.isOnline} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SW Versão</span>
              <Badge variant="outline">{swVersion}</Badge>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Platform:</strong> {status.platform}
          </p>
        </div>

        {/* Cache List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Caches Disponíveis ({caches.length})</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={listCaches}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
              <Button size="sm" variant="destructive" onClick={clearAllCaches}>
                <Trash2 className="w-3 h-3 mr-1" />
                Limpar Tudo
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {caches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cache encontrado</p>
            ) : (
              caches.map((cacheName) => (
                <div key={cacheName} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-mono">{cacheName}</span>
                  <Button size="sm" variant="ghost" onClick={() => clearSpecificCache(cacheName)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button onClick={testNotification} variant="outline">
            Testar Notificação
          </Button>
          <Button onClick={checkPWAStatus} variant="outline">
            Verificar Status
          </Button>
          <Button onClick={unregisterSW} variant="destructive">
            Desregistrar SW
          </Button>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 <strong>Dica:</strong> Este painel só aparece em modo de desenvolvimento. Use para debug e testes do PWA.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
