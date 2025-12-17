"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GroupsAPI, CreateGroupData, UpdateMemberData } from "@/lib/api/groups";
import { toast } from "sonner";
import { useUserAuth } from "@/context/userAuthContext";

// Query Keys
export const groupsKeys = {
  all: ["groups"] as const,
  lists: () => [...groupsKeys.all, "list"] as const,
  list: () => [...groupsKeys.lists()] as const,
  details: () => [...groupsKeys.all, "detail"] as const,
  detail: (id: number, period?: string) => [...groupsKeys.details(), id, period] as const,
};

// Hook para buscar todos os grupos
export function useGroupsQuery() {
  // Verifica se o usuário é administrador (Personal Trainer)
  const { roles, isFetching } = useUserAuth();

  return useQuery({
    queryKey: groupsKeys.list(),
    queryFn: () => {
      const isAdmin = roles.some(role => role.toLowerCase() === "admin");
      console.log("User is admin:", isAdmin);
      return isAdmin ? GroupsAPI.listGroupsAdmin() : GroupsAPI.listMyGroups()
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !isFetching,
  });
}


// Hook para buscar todos os grupos (admin)
export function useGroupsAdminQuery() {
  return useQuery({
    queryKey: groupsKeys.list(),
    queryFn: () => GroupsAPI.listGroupsAdmin(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para buscar um grupo específico
export function useGroupQuery(groupId: number, period: "week" | "month" | "all" = "week") {
  return useQuery({
    queryKey: groupsKeys.detail(groupId, period),
    queryFn: () => GroupsAPI.getGroup(groupId, period),
    enabled: !!groupId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para criar grupo
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupData) => GroupsAPI.createGroup(data),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      toast.success("Grupo criado com sucesso!");
      return newGroup;
    },
    onError: (error: any) => {
      console.error("Erro ao criar grupo:", error);
      toast.error("Erro ao criar grupo");
    },
  });
}

// Hook para atualizar grupo
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: Partial<CreateGroupData> }) =>
      GroupsAPI.updateGroup(groupId, data),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.details() });
      toast.success("Grupo atualizado com sucesso!");
      return updatedGroup;
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar grupo");
    },
  });
}

// Hook para deletar grupo
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number) => GroupsAPI.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      toast.success("Grupo excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir grupo");
    },
  });
}

// Hook para convidar usuário
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, username }: { groupId: number; username: string }) =>
      GroupsAPI.inviteUser(groupId, username),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(variables.groupId) });
      toast.success("Convite enviado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar convite");
    },
  });
}

// Hook para responder convite
export function useRespondToInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, action }: { groupId: number; action: "accept" | "reject" }) =>
      GroupsAPI.respondToInvite(groupId, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      toast.success(variables.action === "accept" ? "Convite aceito com sucesso!" : "Convite rejeitado");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao responder convite");
    },
  });
}

// Hook para atualizar membro
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberId, data }: { groupId: number; memberId: number; data: UpdateMemberData }) =>
      GroupsAPI.updateMember(groupId, memberId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(variables.groupId) });
      toast.success("Membro atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar membro");
    },
  });
}

// Hook para remover membro
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: number; memberId: number }) =>
      GroupsAPI.removeMember(groupId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(variables.groupId) });
      toast.success("Membro removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover membro");
    },
  });
}

// Hook para sair do grupo
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number) => GroupsAPI.leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      toast.success("Você saiu do grupo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao sair do grupo");
    },
  });
}
