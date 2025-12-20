"use client";

import { useEffect, useState } from "react";
import { GroupDetails } from "@/app/(app)/groups/_components/group-details";
import { useGroupQuery } from "@/hooks/useGroupsQuery";
import { GroupDetailsSkeleton } from "@/app/(app)/groups/_components/group-details-skeleton";

export default function SingleGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const [groupId, setGroupId] = useState<number | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    params.then(({ id }) => {
      if (id) {
        setGroupId(Number(id));
      }
    });
  }, [params]);

  const { data: group, isLoading } = useGroupQuery(groupId!, period);

  if (!groupId) return <div className="text-center text-muted-foreground py-8">ID do grupo não fornecido</div>;
  if (isLoading) return <GroupDetailsSkeleton />;
  if (!group) return <div className="text-center text-muted-foreground py-8">Grupo não encontrado</div>;

  return <GroupDetails group={group} period={period} onPeriodChange={setPeriod} />;
}
