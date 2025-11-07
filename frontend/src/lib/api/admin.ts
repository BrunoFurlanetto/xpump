// Admin API - Endpoints para painel administrativo

export interface AdminGroupStats {
  group_id: number;
  group_name: string;
  total_members: number;
  active_members_today: number;
  total_workouts: number;
  total_meals: number;
  pending_validations: number;
  avg_completion_rate: number;
}

export interface AdminWorkoutDetail {
  id: number;
  user_id: number;
  username: string;
  location?: string;
  comments: string;
  workout_date: string;
  duration: string;
  base_points: number;
  multiplier: number;
  validation_status: number;
  validation_status_name: string;
  proofs: Array<{
    id: number;
    file: string;
  }>;
  created_at: string;
}

export interface AdminMealDetail {
  id: number;
  user_id: number;
  username: string;
  meal_type_id: number;
  meal_type_name: string;
  meal_time: string;
  comments?: string;
  base_points: number;
  multiplier: number;
  validation_status: number;
  validation_status_name: string;
  proofs: Array<{
    id: number;
    file: string;
  }>;
  created_at: string;
}

export interface AdminMemberActivity {
  user_id: number;
  username: string;
  email: string;
  total_workouts: number;
  total_meals: number;
  total_points: number;
  current_streak: number;
  last_activity: string;
  is_active_today: boolean;
}

export interface AdminDashboardData {
  stats: AdminGroupStats;
  recent_workouts: AdminWorkoutDetail[];
  recent_meals: AdminMealDetail[];
  top_members: AdminMemberActivity[];
}

export interface UpdateValidationData {
  validation_status: number;
  admin_notes?: string;
}

export class AdminAPI {
  /**
   * Get dashboard data for a specific group
   */
  static async getDashboard(groupId: number): Promise<AdminDashboardData> {
    const response = await fetch(`/api/admin/dashboard?groupId=${groupId}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar dados do dashboard");
    }

    return response.json();
  }

  /**
   * Get all workouts for a specific group with filters
   */
  static async getGroupWorkouts(
    groupId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      userId?: number;
      status?: number;
    }
  ): Promise<AdminWorkoutDetail[]> {
    const params = new URLSearchParams({
      groupId: groupId.toString(),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.userId && { userId: filters.userId.toString() }),
      ...(filters?.status && { status: filters.status.toString() }),
    });

    const response = await fetch(`/api/admin/workouts?${params}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar treinos do grupo");
    }

    return response.json();
  }

  /**
   * Get all meals for a specific group with filters
   */
  static async getGroupMeals(
    groupId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      userId?: number;
      status?: number;
    }
  ): Promise<AdminMealDetail[]> {
    const params = new URLSearchParams({
      groupId: groupId.toString(),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.userId && { userId: filters.userId.toString() }),
      ...(filters?.status && { status: filters.status.toString() }),
    });

    const response = await fetch(`/api/admin/meals?${params}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar refeições do grupo");
    }

    return response.json();
  }

  /**
   * Get activity summary for all members in a group
   */
  static async getGroupMembers(groupId: number): Promise<AdminMemberActivity[]> {
    const response = await fetch(`/api/admin/members?groupId=${groupId}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar membros do grupo");
    }

    return response.json();
  }

  /**
   * Update validation status of a workout
   */
  static async updateWorkoutValidation(
    workoutId: number,
    data: UpdateValidationData
  ): Promise<AdminWorkoutDetail> {
    const response = await fetch(`/api/admin/workouts/${workoutId}/validate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao atualizar validação" }));
      throw new Error(error.detail || "Erro ao atualizar validação");
    }

    return response.json();
  }

  /**
   * Update validation status of a meal
   */
  static async updateMealValidation(
    mealId: number,
    data: UpdateValidationData
  ): Promise<AdminMealDetail> {
    const response = await fetch(`/api/admin/meals/${mealId}/validate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao atualizar validação" }));
      throw new Error(error.detail || "Erro ao atualizar validação");
    }

    return response.json();
  }

  /**
   * Get group statistics for a date range
   */
  static async getGroupStats(
    groupId: number,
    startDate: string,
    endDate: string
  ): Promise<AdminGroupStats> {
    const params = new URLSearchParams({
      groupId: groupId.toString(),
      startDate,
      endDate,
    });

    const response = await fetch(`/api/admin/stats?${params}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas do grupo");
    }

    return response.json();
  }
}
