"use client";

import { createContext, useContext, ReactNode } from "react";
import { useGroups } from "@/hooks/useGroups";
import { Group, CreateGroupData, UpdateMemberData } from "@/lib/api/groups";

interface GroupsContextType {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  isSubmitting: boolean;
  fetchGroups: () => Promise<void>;
  fetchGroup: (groupId: number) => Promise<Group | null>;
  createGroup: (data: CreateGroupData) => Promise<Group | null>;
  updateGroup: (groupId: number, data: Partial<CreateGroupData>) => Promise<Group | null>;
  deleteGroup: (groupId: number) => Promise<boolean>;
  inviteUser: (groupId: number, username: string) => Promise<boolean>;
  respondToInvite: (groupId: number, action: "accept" | "reject") => Promise<boolean>;
  updateMember: (groupId: number, memberId: number, data: UpdateMemberData) => Promise<boolean>;
  removeMember: (groupId: number, memberId: number) => Promise<boolean>;
  leaveGroup: (groupId: number) => Promise<boolean>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const groupsData = useGroups();

  return <GroupsContext.Provider value={groupsData}>{children}</GroupsContext.Provider>;
}

export function useGroupsContext() {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error("useGroupsContext must be used within a GroupsProvider");
  }
  return context;
}
