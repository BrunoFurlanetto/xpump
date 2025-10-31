"use client";

import React, { useEffect, useState } from "react";
import { GroupDetails } from "@/app/(app)/groups/_components/group-details";
import { useGroups } from "@/hooks/useGroups";
import { Group } from "@/lib/api/groups";

const SingleGroupPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const [groupId, setGroupId] = useState<number | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const { fetchGroup, isLoading } = useGroups();

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
};

export default SingleGroupPage;
