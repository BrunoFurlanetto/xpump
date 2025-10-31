"use client";

import { CreateGroupModal } from "@/app/(app)/groups/_components/create-group-modal";
import { PendingInvites } from "@/app/(app)/groups/_components/pending-invites";
import GroupTips from "./_components/group-tips";
import GroupsErrorRequest from "./_components/group-error-request";
import GroupList from "./_components/group-list";
import { Suspense } from "react";
import { PendingInvitesSkeleton } from "./_components/pending-invites-skeleton";
import { GroupListSkeleton } from "./_components/group-list-skeleton";
import { GroupsLoadingProvider } from "./_components/groups-loading-context";
import { useGroups } from "@/hooks/useGroups";

export default function GroupsPage() {
  const { groups, isLoading } = useGroups();

  // Create a promise-like structure for compatibility with existing components
  const groupsPromise = Promise.resolve({ groups });
  const errorPromise = Promise.resolve({});

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

        {isLoading ? (
          <>
            <PendingInvitesSkeleton />
            <GroupListSkeleton />
          </>
        ) : (
          <>
            <Suspense fallback={<PendingInvitesSkeleton />}>
              <PendingInvites groupsPromise={groupsPromise} />
            </Suspense>
            <Suspense fallback={null}>
              <GroupsErrorRequest groupsPromise={errorPromise} />
            </Suspense>

            {/* Grupos */}
            <div className="space-y-6">
              <Suspense fallback={<GroupListSkeleton />}>
                <GroupList groupsPromise={groupsPromise} />
              </Suspense>
              <GroupTips />
            </div>
          </>
        )}
      </div>
    </GroupsLoadingProvider>
  );
}
