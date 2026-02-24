"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/context/navigationContext";
import { Home, Dumbbell, Utensils, MessageSquare, User, Trophy } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useTheme } from "@/context/ThemeContext";
import { useUserAuth } from "@/context/userAuthContext";

interface MobileNavbarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  onlyAdmin?: boolean;
}

const navigationItems: NavItem[] = [
  {
    title: "Feed",
    href: "/feed",
    icon: MessageSquare,
  },
  {
    title: "Treinos",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    title: "Refeições",
    href: "/meals",
    icon: Utensils,
  },
  {
    title: "Ranking",
    href: "/groups",
    icon: Trophy,
  },
  {
    title: "Legado",
    href: "/profile",
    icon: User,
  },
];

export function MobileNavbar({ className }: MobileNavbarProps) {
  const pathname = usePathname();
  // const { toggleMobileMenu } = useNavigation();
  const { actualTheme } = useTheme();
  const { isAdmin } = useUserAuth();

  return (
    <>
      {/* Top Bar */}
      <div
        className={cn(
          "border-b border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className,
        )}
      >
        <div className="flex h-14 items-center px-4">
          <Link href="/" className="flex items-center">
            <Image
              src={actualTheme === "dark" ? "/logo/dark_simple.png" : "/logo/simple.png"}
              alt="Start Logo"
              width={100}
              height={32}
              className="h-8"
            />
          </Link>

          <div className="ml-auto flex items-center space-x-2">
            <NotificationBell />
            {/* <Button variant="ghost" size="sm" onClick={toggleMobileMenu} className="h-9 w-9 p-0">
              <Menu className="h-5 w-5 text-gray-100" />
              <span className="sr-only">Abrir menu</span>
            </Button> */}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 pb-3 left-0 right-0 z-50 border-t border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            if (isAdmin && item.title === "Ranking") {
              item.title = "Empresas";
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 text-xs transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn("text-xs", isActive && "font-medium")}>{item.title}</span>
              </Link>
            );
          })}

          {/* Menu button */}
          {/* <button */}
          {/*   onClick={toggleMobileMenu} */}
          {/*   className="flex flex-col items-center justify-center space-y-1 text-xs transition-colors text-muted-foreground hover:text-foreground" */}
          {/* > */}
          {/*   <MoreHorizontal className="h-5 w-5" /> */}
          {/*   <span className="text-xs">Mais</span> */}
          {/* </button> */}
        </div>
      </div>
    </>
  );
}
