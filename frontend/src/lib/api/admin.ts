// Admin API - Endpoints para painel administrativo

// ===== DASHBOARD GERAL DO SISTEMA (Personal Trainer) =====
export interface SystemDashboardStats {
  // User statistics
  total_users: number;
  active_users: number;
  inactive_users: number;
  new_users_this_month: number;
  new_users_this_week: number;
  new_users_today: number;

  // Client statistics
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  new_clients_this_month: number;
  new_clients_this_week: number;
  new_clients_today: number;

  // Group statistics
  total_groups: number;

  // Workout statistics
  total_workouts: number;
  workouts_today: number;
  workouts_this_week: number;
  workouts_this_month: number;

  // Meal statistics
  total_meals: number;
  meals_today: number;
  meals_this_week: number;
  meals_this_month: number;

  // Social feed statistics
  total_posts: number;
  posts_today: number;
  posts_this_week: number;
  posts_this_month: number;

  total_comments: number;
  comments_today: number;
  comments_this_week: number;
  comments_this_month: number;

  total_likes: number;
  likes_today: number;
  likes_this_week: number;
  likes_this_month: number;

  // Moderation statistics
  pending_reports: number;

  // Gamification statistics
  average_user_level: number;
  average_user_score: number;
  average_workout_streak: number;
  average_meal_streak: number;

  // Season statistics
  active_seasons: number;
}

export interface ClientOverview {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  date_joined: string;

  // Profile info
  profile_score: number;
  profile_level: number;

  // Activity counts
  workout_count: number;
  meal_count: number;
  post_count: number;

  // Streaks
  current_workout_streak: number;
  longest_workout_streak: number;
  current_meal_streak: number;
  longest_meal_streak: number;

  // Last activity
  last_activity: string | null;
  is_active: boolean;

  // Group memberships
  group_count: number;
}

export interface GroupOverview {
  id: number;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  owner: string;
  is_main: boolean;

  // Member statistics
  member_count: number;
  active_members_today: number;
  active_members_this_week: number;

  // Activity statistics
  total_workouts: number;
  total_meals: number;
  workouts_this_week: number;
  meals_this_week: number;

  // Top performer
  top_performer_username: string | null;
  top_performer_score: number | null;
}

export interface SystemActivity {
  id: number;
  type: string;
  user_id: number;
  user_name: string;
  description: string;
  timestamp: string;
  related_id: number | null;
  details?: any;
}

// ===== DASHBOARD DE GRUPO (Admin específico de grupo) =====
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

export interface CreateClientData {
  name: string;
  cnpj: string;
  contact_email: string;
  phone: string;
  address: string;
  owner_username: string;
  owner_email: string;
  owner_password: string;
  owner_first_name: string;
  owner_last_name: string;
}

export class AdminAPI {
  // ===== ENDPOINTS PARA DASHBOARD GERAL DO SISTEMA =====

  /**
   * Busca estatísticas gerais do sistema (visão do Personal Trainer)
   */
  static async getSystemDashboardStats(): Promise<SystemDashboardStats> {
    const response = await fetch("/api/admin/system/stats");

    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas do sistema");
    }
    return response.json();
  }

  /**
   * Busca lista de todos os clientes com suas estatísticas
   */
  static async getAllClients(
    page: number = 1,
    pageSize: number = 10,
    orderBy: string = "-last_activity",
    filters?: {
      is_active?: boolean;
      search?: string;
    }
  ): Promise<{ results: ClientOverview[]; count: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ordering: orderBy,
      ...(filters?.is_active !== undefined && { is_active: filters.is_active.toString() }),
      ...(filters?.search && { search: filters.search }),
    });

    const response = await fetch(`/api/admin/system/clients?${params}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar clientes");
    }
    return response.json();
  }

  /**
   * Busca lista de todos os grupos com estatísticas
   */
  static async getAllGroups(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ results: GroupOverview[]; count: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(`/api/admin/system/groups?${params}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar grupos");
    }
    return response.json();
  }

  /**
   * Busca atividades recentes no sistema
   */
  static async getSystemActivities(limit: number = 20, type?: string): Promise<SystemActivity[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(type && { type }),
    });

    const response = await fetch(`/api/admin/system/activities?${params}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar atividades do sistema");
    }
    return response.json();
  }

  /**
   * Busca estatísticas detalhadas de um cliente específico
   */
  static async getClientDetail(clientId: number): Promise<ClientOverview> {
    const response = await fetch(`/api/admin/system/clients/${clientId}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar detalhes do cliente");
    }
    return response.json();
  }

  /**
   * Cria um novo cliente com usuário owner
   */
  static async createClient(data: CreateClientData): Promise<any> {
    const response = await fetch("/api/v1/clients/create-with-owner/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao criar cliente" }));
      throw new Error(error.detail || error.message || "Erro ao criar cliente");
    }

    return response.json();
  }

  // ===== ENDPOINTS PARA DASHBOARD DE GRUPO =====

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
  static async updateWorkoutValidation(workoutId: number, data: UpdateValidationData): Promise<AdminWorkoutDetail> {
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
  static async updateMealValidation(mealId: number, data: UpdateValidationData): Promise<AdminMealDetail> {
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
  static async getGroupStats(groupId: number, startDate: string, endDate: string): Promise<AdminGroupStats> {
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
