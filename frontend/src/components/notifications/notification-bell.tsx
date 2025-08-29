"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative h-9 w-9 p-0"
      asChild
    >
      <Link href="/notifications">
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        <span className="sr-only">
          {unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
        </span>
      </Link>
    </Button>
  );
}
