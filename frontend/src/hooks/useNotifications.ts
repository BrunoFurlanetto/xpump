"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "achievement" | "streak" | "reminder" | "social" | "challenge";
  title: string;
  message: string;
  icon: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  metadata?: {
    achievement_id?: string;
    streak_days?: number;
    points_earned?: number;
    user_mentioned?: string;
    group_id?: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "workout" | "meal" | "streak" | "social" | "points";
  requirements: {
    type: "count" | "streak" | "points" | "consistency";
    target: number;
    timeframe?: "daily" | "weekly" | "monthly" | "all-time";
  };
  rewards: {
    points: number;
    badge_icon?: string;
    title_unlock?: string;
  };
  isUnlocked: boolean;
  progress: number;
  unlockedAt?: string;
}

export interface NotificationSettings {
  achievements: boolean;
  streaks: boolean;
  reminders: boolean;
  social: boolean;
  challenges: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  daily_reminder_time: string; // HH:MM format
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  achievements: Achievement[];
  settings: NotificationSettings;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  checkForNewAchievements: () => Promise<void>;
  sendTestNotification: () => void;
}

// Conquistas predefinidas
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_workout",
    title: "Primeiro Treino",
    description: "Complete seu primeiro treino no Start",
    icon: "🏋️",
    category: "workout",
    requirements: {
      type: "count",
      target: 1,
      timeframe: "all-time",
    },
    rewards: {
      points: 50,
      badge_icon: "🥉",
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "workout_streak_7",
    title: "Guerreiro da Semana",
    description: "Mantenha uma sequência de 7 dias consecutivos de treino",
    icon: "🔥",
    category: "streak",
    requirements: {
      type: "streak",
      target: 7,
      timeframe: "daily",
    },
    rewards: {
      points: 200,
      badge_icon: "🏅",
      title_unlock: "Guerreiro",
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "meal_consistency",
    title: "Nutri Master",
    description: "Complete todas as 4 refeições por 5 dias consecutivos",
    icon: "🍽️",
    category: "meal",
    requirements: {
      type: "consistency",
      target: 5,
      timeframe: "daily",
    },
    rewards: {
      points: 150,
      badge_icon: "👨‍🍳",
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "points_1000",
    title: "Milionário",
    description: "Acumule 1000 pontos totais",
    icon: "💰",
    category: "points",
    requirements: {
      type: "points",
      target: 1000,
      timeframe: "all-time",
    },
    rewards: {
      points: 100,
      badge_icon: "💎",
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "social_butterfly",
    title: "Social Butterfly",
    description: "Receba 50 curtidas em seus posts",
    icon: "🦋",
    category: "social",
    requirements: {
      type: "count",
      target: 50,
      timeframe: "all-time",
    },
    rewards: {
      points: 75,
      badge_icon: "⭐",
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "workout_beast",
    title: "Beast Mode",
    description: "Complete 100 treinos",
    icon: "🦍",
    category: "workout",
    requirements: {
      type: "count",
      target: 100,
      timeframe: "all-time",
    },
    rewards: {
      points: 500,
      badge_icon: "🦍",
      title_unlock: "Beast",
    },
    isUnlocked: false,
    progress: 0,
  },
];

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [settings, setSettings] = useState<NotificationSettings>({
    achievements: true,
    streaks: true,
    reminders: true,
    social: true,
    challenges: true,
    push_enabled: true,
    email_enabled: false,
    daily_reminder_time: "08:00",
  });
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      // TODO: Implementar chamadas para API real
      // Por enquanto, dados mock para desenvolvimento
      const mockNotifications: Notification[] = [
        // {
        //   id: "notif_1",
        //   type: "achievement",
        //   title: "Nova Conquista! 🏆",
        //   message: "Você desbloqueou: Primeiro Treino",
        //   icon: "🏋️",
        //   isRead: false,
        //   priority: "high",
        //   createdAt: "2025-08-29T08:00:00Z",
        //   actionUrl: "/achievements",
        //   metadata: {
        //     achievement_id: "first_workout",
        //     points_earned: 50,
        //   },
        // },
        // {
        //   id: "notif_2",
        //   type: "streak",
        //   title: "Sequência Mantida! 🔥",
        //   message: "Parabéns! Você manteve sua sequência de treinos por 5 dias",
        //   icon: "🔥",
        //   isRead: false,
        //   priority: "medium",
        //   createdAt: "2025-08-29T07:30:00Z",
        //   metadata: {
        //     streak_days: 5,
        //     points_earned: 25,
        //   },
        // },
        // {
        //   id: "notif_3",
        //   type: "reminder",
        //   title: "Hora do Treino! 💪",
        //   message: "Não se esqueça de registrar seu treino de hoje",
        //   icon: "⏰",
        //   isRead: true,
        //   priority: "low",
        //   createdAt: "2025-08-28T20:00:00Z",
        //   expiresAt: "2025-08-29T23:59:59Z",
        // },
        // {
        //   id: "notif_4",
        //   type: "social",
        //   title: "Novo Comentário 💬",
        //   message: "Ana Costa comentou no seu post de treino",
        //   icon: "💬",
        //   isRead: true,
        //   priority: "medium",
        //   createdAt: "2025-08-28T18:30:00Z",
        //   actionUrl: "/feed",
        //   metadata: {
        //     user_mentioned: "Ana Costa",
        //   },
        // },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      toast.error("Erro ao carregar notificações");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Implementar chamada para API
      console.log("Marcando notificação como lida:", notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      toast.error("Erro ao atualizar notificação");
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Implementar chamada para API
      console.log("Marcando todas as notificações como lidas");

      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));

      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast.error("Erro ao atualizar notificações");
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // TODO: Implementar chamada para API
      console.log("Deletando notificação:", notificationId);

      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));

      toast.success("Notificação removida");
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      toast.error("Erro ao remover notificação");
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      // TODO: Implementar chamada para API
      console.log("Atualizando configurações:", newSettings);

      setSettings((prev) => ({ ...prev, ...newSettings }));
      toast.success("Configurações atualizadas");
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      toast.error("Erro ao salvar configurações");
      throw error;
    }
  };

  const checkForNewAchievements = async () => {
    try {
      // TODO: Implementar lógica real baseada nas estatísticas do usuário
      console.log("Verificando novas conquistas...");

      // Simulação de conquista desbloqueada
      const randomAchievement = achievements.find((a) => !a.isUnlocked);
      if (randomAchievement && Math.random() > 0.7) {
        const unlockedAchievement = {
          ...randomAchievement,
          isUnlocked: true,
          progress: 100,
          unlockedAt: new Date().toISOString(),
        };

        setAchievements((prev) =>
          prev.map((achievement) => (achievement.id === randomAchievement.id ? unlockedAchievement : achievement))
        );

        // Criar notificação da conquista
        const newNotification: Notification = {
          id: `notif_${Date.now()}`,
          type: "achievement",
          title: "Nova Conquista! 🏆",
          message: `Você desbloqueou: ${unlockedAchievement.title}`,
          icon: unlockedAchievement.icon,
          isRead: false,
          priority: "high",
          createdAt: new Date().toISOString(),
          actionUrl: "/achievements",
          metadata: {
            achievement_id: unlockedAchievement.id,
            points_earned: unlockedAchievement.rewards.points,
          },
        };

        setNotifications((prev) => [newNotification, ...prev]);
        toast.success(`🏆 Conquista desbloqueada: ${unlockedAchievement.title}!`);
      }
    } catch (error) {
      console.error("Erro ao verificar conquistas:", error);
    }
  };

  const sendTestNotification = () => {
    const testNotification: Notification = {
      id: `test_${Date.now()}`,
      type: "reminder",
      title: "Notificação de Teste 🧪",
      message: "Esta é uma notificação de teste para verificar o sistema",
      icon: "🧪",
      isRead: false,
      priority: "medium",
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [testNotification, ...prev]);
    toast.success("Notificação de teste criada!");
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    achievements,
    settings,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    checkForNewAchievements,
    sendTestNotification,
  };
}
