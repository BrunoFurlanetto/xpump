"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

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
  // Usa a env var se disponível; caso contrário busca do backend
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/vapid-public-key/`);
  const data = await res.json();
  return data.vapid_public_key;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkExistingSubscription();
    }
  }, []);

  async function checkExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const browserSub = await registration.pushManager.getSubscription();
      if (!browserSub) return;

      // Verificar se o backend conhece esta subscription
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/subscribe/`);
      if (!res.ok) return;
      const list = await res.json();
      const existing = (list.results ?? list).find(
        (s: { id: number; endpoint: string }) => s.endpoint === browserSub.endpoint
      );
      if (existing) {
        setSubscriptionId(existing.id);
      }
    } catch (error) {
      console.error("[Push] Erro ao verificar subscription:", error);
    }
  }

  async function subscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada");
        return;
      }

      // antes de chamar subscribe, logue para depurar
      const vapidKey = await getVapidPublicKey();
      console.log('VAPID PUBLIC KEY:', vapidKey);
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      // ...existing code...
      const browserSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
      })
      
      const subJson = browserSub.toJSON();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/subscribe/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
          user_agent: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSubscriptionId(data.id);
      toast.success("Notificações push ativadas!");
    } catch (error) {
      console.error("[Push] Erro ao ativar:", error);
      toast.error("Erro ao ativar notificações push");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const browserSub = await registration.pushManager.getSubscription();
      await browserSub?.unsubscribe();

      if (subscriptionId) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/subscribe/${subscriptionId}/`, {
          method: "DELETE",
        });
      }

      setSubscriptionId(null);
      toast.success("Notificações push desativadas");
    } catch (error) {
      console.error("[Push] Erro ao desativar:", error);
      toast.error("Erro ao desativar notificações push");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) return null;

  const isSubscribed = subscriptionId !== null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className="gap-2"
    >
      {isSubscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          Desativar notificações push
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Ativar notificações push
        </>
      )}
    </Button>
  );  
}