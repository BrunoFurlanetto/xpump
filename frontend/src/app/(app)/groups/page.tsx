"use client";

import { CreateGroupModal } from "@/app/(app)/groups/_components/create-group-modal";
import { PendingInvites } from "@/app/(app)/groups/_components/pending-invites";
import GroupTips from "./_components/group-tips";
import GroupList from "./_components/group-list";
import { GroupListSkeleton } from "./_components/group-list-skeleton";
import { GroupsLoadingProvider } from "./_components/groups-loading-context";
import { GroupsProvider, useGroupsContext } from "@/context/groupsContext";

function GroupsPageContent() {
  const { groups, isLoading } = useGroupsContext();

  return (
    <GroupsLoadingProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Grupos</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Conecte-se e treine com outros atletas. Compete em grupos e conquiste o topo!
            </p>
          </div>
          <CreateGroupModal />
        </div>
        <PendingInvites groups={groups} />

        {/* Grupos */}
        <div className="space-y-6">
          {isLoading ? <GroupListSkeleton /> : <GroupList groups={groups} />}
          <GroupTips />
        </div>
      </div>
    </GroupsLoadingProvider>
  );
}

export default function GroupsPage() {
  return (
    <GroupsProvider>
      <GroupsPageContent />
    </GroupsProvider>
  );
}
