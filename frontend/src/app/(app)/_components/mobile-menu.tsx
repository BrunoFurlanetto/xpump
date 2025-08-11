"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@/context/navigationContext";
import { useUserAuth } from "@/context/userAuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dumbbell, Users, BarChart3, Settings, LogOut, Activity, User } from "lucide-react";
import { logout } from "@/app/login/actions";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

const menuItems: NavItem[] = [
  {
    title: "Treinos",
    href: "/workouts",
    icon: Dumbbell,
    description: "Seus treinos e exercícios",
  },
  {
    title: "Grupos",
    href: "/groups",
    icon: Users,
    description: "Conecte-se com outros atletas",
  },
  {
    title: "Estatísticas",
    href: "/stats",
    icon: BarChart3,
    description: "Acompanhe seu progresso",
  },
  {
    title: "Atividades",
    href: "/activities",
    icon: Activity,
    description: "Histórico de atividades",
  },
  {
    title: "Perfil",
    href: "/profile",
    icon: User,
    description: "Suas informações pessoais",
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
    description: "Preferências do app",
  },
];

export function MobileMenu() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useNavigation();
  const user = useUserAuth();
  const pathname = usePathname();

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };
  return (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex-1 overflow-y-auto"></div>
        <div className="space-y-2 pb-20">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full text-primary justify-start h-auto p-4", isActive && "bg-muted")}
                asChild
              >
                <Link href={item.href} onClick={handleLinkClick}>
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                    </div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-none hover:bg-red-900 hover:text-red-300"
            asChild
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
