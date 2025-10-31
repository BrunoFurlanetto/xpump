"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { GroupsAPI, Group, CreateGroupData, UpdateMemberData } from "@/lib/api/groups";

interface UseGroupsReturn {
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

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await GroupsAPI.listMyGroups();
      setGroups(data);
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar grupos";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGroup = useCallback(async (groupId: number): Promise<Group | null> => {
    try {
      setIsLoading(true);
      const data = await GroupsAPI.getGroup(groupId);
      setCurrentGroup(data);
      return data;
    } catch (error) {
      console.error("Erro ao buscar grupo:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar grupo";
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (data: CreateGroupData): Promise<Group | null> => {
    try {
      setIsSubmitting(true);
      const newGroup = await GroupsAPI.createGroup(data);

      setGroups((prev) => [...prev, newGroup]);
      toast.success("Grupo criado com sucesso! 🎉");

      return newGroup;
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar grupo";
      toast.error(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateGroup = useCallback(
    async (groupId: number, data: Partial<CreateGroupData>): Promise<Group | null> => {
      try {
        setIsSubmitting(true);
        const updatedGroup = await GroupsAPI.updateGroup(groupId, data);

        setGroups((prev) => prev.map((group) => (group.id === groupId ? updatedGroup : group)));

        if (currentGroup?.id === groupId) {
          setCurrentGroup(updatedGroup);
        }

        toast.success("Grupo atualizado com sucesso! ✅");
        return updatedGroup;
      } catch (error) {
        console.error("Erro ao atualizar grupo:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar grupo";
        toast.error(errorMessage);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentGroup]
  );

  const deleteGroup = useCallback(
    async (groupId: number): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        await GroupsAPI.deleteGroup(groupId);

        setGroups((prev) => prev.filter((group) => group.id !== groupId));

        if (currentGroup?.id === groupId) {
          setCurrentGroup(null);
        }

        toast.success("Grupo deletado com sucesso! 🗑️");
        return true;
      } catch (error) {
        console.error("Erro ao deletar grupo:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao deletar grupo";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentGroup]
  );

  const inviteUser = useCallback(async (groupId: number, username: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      await GroupsAPI.inviteUser(groupId, username);

      toast.success(`Convite enviado para @${username}! 📨`);
      return true;
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao enviar convite";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const respondToInvite = useCallback(
    async (groupId: number, action: "accept" | "reject"): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        await GroupsAPI.respondToInvite(groupId, action);

        const message = action === "accept" ? "Convite aceito! Bem-vindo ao grupo! 🎉" : "Convite recusado";

        toast.success(message);

        // Reload groups to update pending status
        await fetchGroups();

        return true;
      } catch (error) {
        console.error("Erro ao responder convite:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao responder convite";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchGroups]
  );

  const updateMember = useCallback(
    async (groupId: number, memberId: number, data: UpdateMemberData): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        await GroupsAPI.updateMember(groupId, memberId, data);

        // Reload current group to get updated member data
        await fetchGroup(groupId);

        const message = data.is_admin ? "Membro promovido a administrador! 👑" : "Administrador removido do membro";

        toast.success(message);
        return true;
      } catch (error) {
        console.error("Erro ao atualizar membro:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar membro";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchGroup]
  );

  const removeMember = useCallback(
    async (groupId: number, memberId: number): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        await GroupsAPI.removeMember(groupId, memberId);

        // Reload current group to get updated member list
        await fetchGroup(groupId);

        toast.success("Membro removido do grupo! 👋");
        return true;
      } catch (error) {
        console.error("Erro ao remover membro:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao remover membro";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchGroup]
  );

  const leaveGroup = useCallback(
    async (groupId: number): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        await GroupsAPI.leaveGroup(groupId);

        setGroups((prev) => prev.filter((group) => group.id !== groupId));

        if (currentGroup?.id === groupId) {
          setCurrentGroup(null);
        }

        toast.success("Você saiu do grupo! 👋");
        return true;
      } catch (error) {
        console.error("Erro ao sair do grupo:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao sair do grupo";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentGroup]
  );

  // Load groups on mount - only once
  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - fetch only on mount

  return {
    groups,
    currentGroup,
    isLoading,
    isSubmitting,
    fetchGroups,
    fetchGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    inviteUser,
    respondToInvite,
    updateMember,
    removeMember,
    leaveGroup,
  };
}
