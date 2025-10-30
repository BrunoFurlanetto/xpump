"use server";

import { authFetchWithRetry } from "@/lib/auth-fetch";
import { BACKEND_URL } from "@/lib/constants";
import { getCurrentUser } from "./getCurrentUser";

interface Profile {
  id: number;
  user: number;
  height: number | null;
  weight: number | null;
  photo: string | null;
  notification_preferences: undefined;
  score: number;
  level: number;
  points_to_next_level: number;
  groups: {
    id: number;
    name: string;
    member_count: number;
    position: number;
  }[];
  pending_groups: {
    id: number;
    name: string;
    member_count: number;
    position: number;
  }[];
  workout_streak: {
    current_streak: number;
    longest_streak: number;
    weekly_remaining: number;
    weekly_expected: number;
    last_workout_date: string | null;
  };
  meal_streak: {
    current_streak: number;
    longest_streak: number;
    weekly_remaining: number;
    weekly_expected: number;
    last_meal_date: string | null;
  };
}

export const getProfileById = async (
  profileId: string,
): Promise<Profile | null> => {
  try {
    const response = await authFetchWithRetry(
      `${BACKEND_URL}/profiles/${profileId}/`,
    );
    if (!response.ok) {
      throw new Error("Erro ao buscar perfil");
    }
    const profile = await response.json();
    return profile;
  } catch {
    return null;
  }
};

export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const user = await getCurrentUser();
    if (!user?.profile_id) {
      return null;
    }
    const profile = await getProfileById(user.profile_id);
    return profile;
  } catch {
    return null;
  }
};
