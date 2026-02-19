"use client";

import { CreateGroupModal } from "@/app/(app)/groups/_components/create-group-modal";
import { PendingInvites } from "@/app/(app)/groups/_components/pending-invites";
import GroupTips from "./_components/group-tips";
import GroupList from "./_components/group-list";
import { GroupListSkeleton } from "./_components/group-list-skeleton";
import { GroupsLoadingProvider } from "./_components/groups-loading-context";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useGroupsQuery } from "@/hooks/useGroupsQuery";
import { useAuth } from "@/hooks/useAuth";

export default function GroupsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { data: groups = [], isLoading } = useGroupsQuery();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;

    const searchLower = searchTerm.toLowerCase();
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(searchLower) || group.description?.toLowerCase().includes(searchLower),
    );
  }, [groups, searchTerm]);

  return (
    <GroupsLoadingProvider>
      <div className="space-y-6">
        {/* Header */}
        {!isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Rankings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Conecte-se e treine com outros atletas. Compete em grupos e conquiste o topo!
              </p>
            </div>
            <CreateGroupModal />
          </div>
        )}
        <PendingInvites groups={groups} />

        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grupos */}
        <div className="space-y-6">
          {isLoading ? (
            <GroupListSkeleton />
          ) : (
            <>
              <GroupList groups={filteredGroups} />
              {searchTerm && filteredGroups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum grupo encontrado com "{searchTerm}"</p>
                </div>
              )}
            </>
          )}
          {/* <GroupTips /> */}
        </div>
      </div>
    </GroupsLoadingProvider>
  );
}
