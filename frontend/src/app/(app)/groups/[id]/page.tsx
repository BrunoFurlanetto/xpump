import React from "react";
import { groupsApi } from "../../_actions/groups";
import { GroupDetails } from "@/app/(app)/groups/_components/group-details";

const SingleGroupPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const groups = await groupsApi();
  const { id } = await params;
  if (!id) return <div>ID do grupo não fornecido</div>;
  const group = await groups.get(Number(id));
  return <GroupDetails group={group} />;
};

export default SingleGroupPage;
