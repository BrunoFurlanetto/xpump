"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserAuth } from "@/context/userAuthContext";
import { Home, Dumbbell, Users, BarChart3, User, Settings, LogOut, Activity } from "lucide-react";
import { logout } from "@/app/login/actions";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Treinos",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    title: "Grupos",
    href: "/groups",
    icon: Users,
  },
  {
    title: "Estatísticas",
    href: "/stats",
    icon: BarChart3,
  },
  {
    title: "Atividades",
    href: "/activities",
    icon: Activity,
  },
];

const bottomItems: NavItem[] = [
  {
    title: "Perfil",
    href: "/profile",
    icon: User,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const { user } = useUserAuth();
  async function handleLogout() {
    await logout();
  }

  return (
    <div className={cn("pb-12 h-full", className)}>
      <div className="space-y-4 py-4 h-full flex flex-col">
        {/* Logo */}
        <div className="px-3 py-2">
          <Link href="/" className="flex items-center pl-3 mb-2">
            <Image src="/logo/simple.png" alt="XPump Logo" width={120} height={40} className="h-8" />
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="px-3 flex-1">
          <div className="space-y-1">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-gray-200 h-10",
                      isActive && "bg-muted font-medium text-foreground"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                      {item.badge && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="px-3">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">Conta</h2>
            <div className="space-y-1">
              {bottomItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-gray-200 h-10",
                      isActive && "bg-muted font-medium text-foreground"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </Button>
                );
              })}

              {/* User Info */}
              <div className="px-4 py-2 mt-4 border-t border-muted">
                <p className="text-sm font-medium text-foreground">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
