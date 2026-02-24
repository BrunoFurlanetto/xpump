"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

const DISMISSED_KEY = "push-notification-dismissed";
const DISMISSED_DATE_KEY = "push-notification-dismissed-date";
const DAYS_BEFORE_RESHOWING = 7;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getVapidPublicKey(): Promise<string> {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
  const res = await fetch(
    `/api/v1/notifications/vapid-public-key/`
  );
  const data = await res.json();
  return data.vapid_public_key;
}

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission === "granted") return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const dismissedDate = localStorage.getItem(DISMISSED_DATE_KEY);

    if (dismissed && dismissedDate) {
      const daysSince =
        (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSince < DAYS_BEFORE_RESHOWING) return;
      localStorage.removeItem(DISMISSED_KEY);
      localStorage.removeItem(DISMISSED_DATE_KEY);
    }

    // Delay para não sobrepor outros banners ao abrir o app
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, "true");
    localStorage.setItem(DISMISSED_DATE_KEY, Date.now().toString());
  }

  async function handleEnable() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada");
        setShow(false);
        return;
      }

      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) await existingSub.unsubscribe();

      const vapidKey = await getVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      const browserSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = browserSub.toJSON();
      const res = await fetch(
        `/api/v1/notifications/subscribe/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
            user_agent: navigator.userAgent,
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("Notificações push ativadas!");
      setShow(false);
    } catch (error) {
      console.error("[Push] Erro ao ativar:", error);
      toast.error("Erro ao ativar notificações push");
    } finally {
      setIsLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary text-sm mb-1">
            Ativar notificações
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Receba lembretes de treino, refeições e atualizações em tempo real.
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
              className="flex-1"
            >
              Ativar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary"
              onClick={dismiss}
              disabled={isLoading}
            >
              Agora não
            </Button>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
