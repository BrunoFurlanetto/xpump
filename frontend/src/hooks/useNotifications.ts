"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export type NotificationType =
  | "social_like"
  | "social_comment"
  | "nutrition_plan_updated"
  | "meal_reminder"
  | "broadcast";

export interface Notification {
  id: string;
  type: NotificationType;
  type_display: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

interface BackendNotification {
  id: number;
  notification_type: NotificationType;
  notification_type_display: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => void;
  refetch: () => Promise<void>;
}

function mapNotification(n: BackendNotification): Notification {
  return {
    id: String(n.id),
    type: n.notification_type,
    type_display: n.notification_type_display,
    title: n.title,
    message: n.body,
    data: n.data ?? {},
    isRead: n.is_read,
    createdAt: n.created_at,
  };
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/notifications/");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: BackendNotification[] = data.results ?? data;
      setNotifications(list.map(mapNotification));
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      toast.error("Erro ao carregar notificações");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${notificationId}/read/`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      toast.error("Erro ao atualizar notificação");
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/v1/notifications/read-all/", {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast.error("Erro ao atualizar notificações");
      throw error;
    }
  };

  const deleteNotification = (notificationId: string) => {
    // Backend não tem endpoint de deleção — remove apenas do estado local
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    toast.success("Notificação removida");
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
