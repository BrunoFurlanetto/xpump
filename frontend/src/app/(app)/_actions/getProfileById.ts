import { authFetch } from "@/lib/auth-fetch";
import { BACKEND_URL } from "@/lib/constants";

interface Profile {
    id: number,
    user: number,
    height: number | null,
    weight: number | null,
    photo: string | null,
    notification_preferences: undefined,
    score: number,
    groups: {
        id: number,
        name: string,
        member_count: number,
        position: number
    }[],
    workout_streak: {
    current_streak: number,
    longest_streak: number,
    weekly_remaining: number,
    weekly_expected: number,
    last_workout_date: string | null
  },
  meal_streak: {
    current_streak: number,
    longest_streak: number,
    weekly_remaining: number,
    weekly_expected: number,
    last_meal_date: string | null
  }
}

export const getProfileById = async (profileId: string): Promise<Profile | null> => {
    try {
        const response = await authFetch(`${BACKEND_URL}/profiles/${profileId}/`);
        if (!response.ok) {
            throw new Error("Erro ao buscar perfil");
        }
        const profile = await response.json();
        return profile;
    } catch {
        return null;
    }
}
