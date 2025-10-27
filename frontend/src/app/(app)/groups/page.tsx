import { CreateGroupModal } from "@/app/(app)/groups/_components/create-group-modal";
import { PendingInvites } from "@/app/(app)/groups/_components/pending-invites";
import GroupTips from "./_components/group-tips";
import { groupsApi } from "../_actions/groups";
import GroupsErrorRequest from "./_components/group-error-request";
import GroupList from "./_components/group-list";
import { Suspense } from "react";
import { PendingInvitesSkeleton } from "./_components/pending-invites-skeleton";
import { GroupListSkeleton } from "./_components/group-list-skeleton";
import { GroupsLoadingProvider } from "./_components/groups-loading-context";

export default async function GroupsPage() {
  const groups = await groupsApi();
  const groupsPromise = groups.list();

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

        <Suspense fallback={<PendingInvitesSkeleton />}>
          <PendingInvites groupsPromise={groupsPromise} />
        </Suspense>
        <Suspense fallback={null}>
          <GroupsErrorRequest groupsPromise={groupsPromise} />
        </Suspense>

        {/* Grupos */}
        <div className="space-y-6">
          <Suspense fallback={<GroupListSkeleton />}>
            <GroupList groupsPromise={groupsPromise} />
          </Suspense>
          <GroupTips />
        </div>
      </div>
    </GroupsLoadingProvider>
  );
}
