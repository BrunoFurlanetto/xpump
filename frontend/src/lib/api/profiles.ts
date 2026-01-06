// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_id: number;
}

export interface Profile {
  id: number;
  user: number;
  height: number | null;
  weight: number | null;
  photo: string | null;
  notification_preferences: null;
  score: number;
  level: number;
  points_to_next_level: number;
  groups: ProfileGroup[];
  pending_groups: ProfileGroup[];
  workout_streak: StreakInfo;
  meal_streak: StreakInfo;
}

export interface ProfileWithUser extends Profile {
  userData: User;
}

export interface ProfileGroup {
  id: number;
  name: string;
  member_count: number;
  position: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  weekly_remaining: number;
  weekly_expected: number;
  last_workout_date: string | null;
  last_meal_date?: string | null;
}

export interface UpdateProfileData {
  height?: number;
  weight?: number;
  photo?: File;
  notification_preferences?: null;
}

// Profiles API Class
export class ProfilesAPI {
  /**
   * Get user by ID
   */
  static async getUserById(userId: number | string): Promise<User> {
    const response = await fetch(`/api/auth?endpoint=users/${userId}/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar usuário");
    }

    return response.json();
  }

  /**
   * Get a profile by ID
   */
  static async getProfile(profileId: number | string): Promise<Profile> {
    const response = await fetch(`/api/profiles?endpoint=${profileId}/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar perfil");
    }

    return response.json();
  }

  /**
   * Get profile with user data
   */
  static async getProfileWithUser(profileId: number | string): Promise<ProfileWithUser> {
    const profile = await this.getProfile(profileId);
    const userData = await this.getUserById(profile.user);

    return {
      ...profile,
      userData,
    };
  }

  /**
   * Update profile information
   */
  static async updateProfile(profileId: number | string, data: UpdateProfileData): Promise<Profile> {
    const formData = new FormData();

    if (data.height !== undefined) {
      formData.append("height", data.height.toString());
    }

    if (data.weight !== undefined) {
      formData.append("weight", data.weight.toString());
    }

    if (data.photo) {
      formData.append("photo", data.photo);
    }

    if (data.notification_preferences) {
      formData.append("notification_preferences", JSON.stringify(data.notification_preferences));
    }

    const response = await fetch(`/api/v1/profiles/${profileId}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao atualizar perfil" }));
      throw new Error(error.detail || "Erro ao atualizar perfil");
    }

    return response.json();
  }

  /**
   * Get profile statistics
   */
  static async getProfileStats(profileId: number | string): Promise<{
    workouts: number;
    meals: number;
    points: number;
    level: number;
  }> {
    const response = await fetch(`/api/profiles?endpoint=${profileId}/stats/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas do perfil");
    }

    return response.json();
  }
}
