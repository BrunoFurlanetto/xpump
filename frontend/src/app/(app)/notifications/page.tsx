"use client";

import { useNotifications, type NotificationType } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  Clock,
  Megaphone,
  Utensils,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { PushNotificationManager } from "@/components/pwa/push-notification";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "agora mesmo";
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;

    return date.toLocaleDateString("pt-BR");
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap: Record<NotificationType, React.ElementType> = {
      social_like: Heart,
      social_comment: MessageSquare,
      nutrition_plan_updated: Utensils,
      meal_reminder: Clock,
      broadcast: Megaphone,
    };
    const IconComponent = iconMap[type] ?? Bell;
    return <IconComponent className="h-5 w-5" />;
  };

  const getTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      social_like: "Curtida",
      social_comment: "Comentário",
      nutrition_plan_updated: "Nutrição",
      meal_reminder: "Lembrete",
      broadcast: "Aviso",
    };
    return labels[type] ?? type;
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "social_like":
        return "bg-pink-500/10 border-pink-500/20 text-pink-400";
      case "social_comment":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "nutrition_plan_updated":
        return "bg-green-500/10 border-green-500/20 text-green-400";
      case "meal_reminder":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
      case "broadcast":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400";
      default:
        return "bg-muted border-muted-foreground/20 text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Notificações</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Notificações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acompanhe seus lembretes e atualizações
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="w-full sm:w-auto border-muted-foreground/20 hover:border-muted-foreground/40 text-foreground"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
        <PushNotificationManager />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Não Lidas</p>
                <p className="text-xl sm:text-2xl font-bold text-red-400">{unreadCount}</p>
              </div>
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{notifications.length}</p>
              </div>
              <BellOff className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Suas Notificações
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-500/10 text-red-400">
                {unreadCount} novas
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Suas notificações aparecerão aqui quando houver novidades
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-medium ${
                                !notification.isRead ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {!notification.isRead && <div className="h-2 w-2 bg-primary rounded-full" />}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
