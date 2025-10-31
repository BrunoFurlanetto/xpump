"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ProfilesAPI, Profile, UpdateProfileData } from "@/lib/api/profiles";

interface UseProfilesReturn {
  profile: Profile | null;
  isLoading: boolean;
  isSubmitting: boolean;
  fetchProfile: (profileId: number | string) => Promise<Profile | null>;
  updateProfile: (profileId: number | string, data: UpdateProfileData) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
}

export function useProfiles(initialProfileId?: number | string): UseProfilesReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<number | string | null>(initialProfileId || null);

  const fetchProfile = useCallback(async (profileId: number | string): Promise<Profile | null> => {
    try {
      setIsLoading(true);
      setCurrentProfileId(profileId);

      const data = await ProfilesAPI.getProfile(profileId);
      setProfile(data);

      return data;
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar perfil";
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (profileId: number | string, data: UpdateProfileData): Promise<Profile | null> => {
      try {
        setIsSubmitting(true);

        const updatedProfile = await ProfilesAPI.updateProfile(profileId, data);
        setProfile(updatedProfile);

        toast.success("Perfil atualizado com sucesso! ✅");
        return updatedProfile;
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar perfil";
        toast.error(errorMessage);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (currentProfileId) {
      await fetchProfile(currentProfileId);
    }
  }, [currentProfileId, fetchProfile]);

  return {
    profile,
    isLoading,
    isSubmitting,
    fetchProfile,
    updateProfile,
    refreshProfile,
  };
}
