"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, Utensils, Users, Settings, Menu, X, LogOut, ArrowLeftFromLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { GroupSelector } from "@/components/admin/group-selector";
import { Group, GroupsAPI } from "@/lib/api/groups";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { logout } from "@/app/(auth)/login/actions";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/panel",
    icon: LayoutDashboard,
  },
  {
    title: "Treinos",
    href: "/panel/workouts",
    icon: Dumbbell,
  },
  {
    title: "Alimentação",
    href: "/panel/nutrition",
    icon: Utensils,
  },
  {
    title: "Membros",
    href: "/panel/members",
    icon: Users,
  },
  {
    title: "Configurações",
    href: "/panel/settings",
    icon: Settings,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { actualTheme } = useTheme();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  async function handleLogout() {
    await logout();
  }
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await GroupsAPI.listMyGroups();
      setGroups(data);

      // Seleciona o primeiro grupo automaticamente se houver
      if (data.length > 0 && !selectedGroupId) {
        const savedGroupId = localStorage.getItem("adminSelectedGroupId");
        if (savedGroupId) {
          const groupExists = data.find((g) => g.id === parseInt(savedGroupId));
          setSelectedGroupId(groupExists ? parseInt(savedGroupId) : data[0].id);
        } else {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (groupId: number) => {
    setSelectedGroupId(groupId);
    localStorage.setItem("adminSelectedGroupId", groupId.toString());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-muted bg-card transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-6 pb-1">
            <div>
              <Link href="/">
                <Image
                  src={actualTheme === "light" ? "/logo/dark_simple.png" : "/logo/simple.png"}
                  alt="Start Logo"
                  width={120}
                  height={40}
                  className="h-8"
                />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Painel Administrativo</p>
          </div>

          {/* Group Selector */}
          <div className="p-4">
            {loading ? (
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            ) : (
              <GroupSelector
                groups={groups}
                selectedGroupId={selectedGroupId}
                onGroupChange={handleGroupChange}
                className="w-full"
              />
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sidebarlink h-10",
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
          </nav>

          {/* Footer */}
          <div className="border-t border-muted p-4">
            {/* Logout */}

            <Link
              href="/"
              className={buttonVariants({ variant: "outline", className: "w-full border-none justify-start mb-1" })}
            >
              <ArrowLeftFromLine className="mr-2 h-4 w-4" />
              Voltar ao Site
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 border-none hover:bg-red-900 hover:text-red-300"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="container mx-auto p-6 lg:p-8">
          {selectedGroupId ? (
            children
          ) : (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">Selecione uma empresa para começar</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
