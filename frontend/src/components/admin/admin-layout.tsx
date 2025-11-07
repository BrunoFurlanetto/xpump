"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GroupSelector } from "@/components/admin/group-selector";
import { Group, GroupsAPI } from "@/lib/api/groups";

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
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
          const groupExists = data.find(g => g.id === parseInt(savedGroupId));
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-xl font-bold">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">XPump</p>
          </div>

          {/* Group Selector */}
          <div className="border-b p-4">
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
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground text-center">
              © 2025 XPump Admin
            </p>
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
                <p className="text-lg text-muted-foreground">
                  Selecione uma empresa para começar
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
