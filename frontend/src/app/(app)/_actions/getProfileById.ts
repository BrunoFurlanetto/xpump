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
    streak: {
        current_streak: number,
        longest_streak: number,
        last_workout_date: string | null,
    }
}

export const getProfileById = async (profileId: string): Promise<Profile | null> => {
    try {
        const response = await authFetch(`${BACKEND_URL}/profiles/${profileId}/`);

        if (!response.ok) {
            return null;
        }

        const profile = await response.json();

        return profile;
    } catch {
        return null;
    }
}
