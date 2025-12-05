"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfilesAPI, Profile, ProfileWithUser, UpdateProfileData } from "@/lib/api/profiles";
import { toast } from "sonner";

// Query Keys
export const profilesKeys = {
  all: ["profiles"] as const,
  lists: () => [...profilesKeys.all, "list"] as const,
  list: () => [...profilesKeys.lists()] as const,
  details: () => [...profilesKeys.all, "detail"] as const,
  detail: (id: number | string) => [...profilesKeys.details(), id] as const,
  stats: (id: number | string) => [...profilesKeys.all, "stats", id] as const,
};

// Hook para buscar um perfil específico com dados do usuário
export function useProfileQuery(profileId: number | string | null) {
  return useQuery({
    queryKey: profilesKeys.detail(profileId!),
    queryFn: () => ProfilesAPI.getProfileWithUser(profileId!),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para buscar estatísticas de um perfil
export function useProfileStatsQuery(profileId: number | string | null) {
  return useQuery({
    queryKey: profilesKeys.stats(profileId!),
    queryFn: () => ProfilesAPI.getProfileStats(profileId!),
    enabled: !!profileId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para atualizar perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: number | string; data: UpdateProfileData }) =>
      ProfilesAPI.updateProfile(profileId, data),
    onSuccess: (updatedProfile, variables) => {
      queryClient.invalidateQueries({ queryKey: profilesKeys.detail(variables.profileId) });
      queryClient.invalidateQueries({ queryKey: profilesKeys.stats(variables.profileId) });
      toast.success("Perfil atualizado com sucesso! ✅");
      return updatedProfile;
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });
}
