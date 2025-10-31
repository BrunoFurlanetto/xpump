"use client";

import React, { useEffect, useState } from "react";
import { GroupDetails } from "@/app/(app)/groups/_components/group-details";
import { GroupsProvider, useGroupsContext } from "@/context/groupsContext";
import { Group } from "@/lib/api/groups";

function SingleGroupPageContent({ params }: { params: Promise<{ id: string }> }) {
  const [groupId, setGroupId] = useState<number | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const { fetchGroup, isLoading } = useGroupsContext();

  useEffect(() => {
    params.then(({ id }) => {
      if (id) {
        setGroupId(Number(id));
      }
    });
  }, [params]);

  useEffect(() => {
    if (groupId) {
      fetchGroup(groupId).then((data) => {
        if (data) setGroup(data);
      });
    }
  }, [groupId, fetchGroup]);

  if (!groupId) return <div>ID do grupo não fornecido</div>;
  if (isLoading) return <div>Carregando...</div>;
  if (!group) return <div>Grupo não encontrado</div>;

  return <GroupDetails group={group} />;
}

const SingleGroupPage = ({ params }: { params: Promise<{ id: string }> }) => {
  return (
    <GroupsProvider>
      <SingleGroupPageContent params={params} />
    </GroupsProvider>
  );
};

export default SingleGroupPage;
