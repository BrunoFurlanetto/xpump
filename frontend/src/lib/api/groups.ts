// Types
export interface Group {
  id: number;
  name: string;
  description: string;
  created_by: string; // Nome completo do criador
  owner: number;
  owner_profile_id: number;
  created_at: string;
  members: GroupMember[];
  pending_members: PendingMember[];
  stats: GroupStats;
  main: boolean;
  pending: boolean;
  members_count: number;
  other_groups: {
    id: number;
    name: string;
    owner: string; // Nome completo do dono
    pts: number;
    n_members: number;
  }[];
}

export interface GroupMember {
  id: number;
  profile_id: number;
  full_name: string;
  username: string;
  email: string;
  is_admin: boolean;
  joined_at: string;
  pending: boolean;
  position?: number;
  score?: number;
  workouts?: number;
  meals?: number;
}

export interface PendingMember {
  id: number;
  username: string;
  email: string;
  joined_at: string;
}

export interface GroupStats {
  total_members: number;
  total_points: number;
  total_workouts: number;
  total_meals: number;
  mean_streak: number;
  mean_workout_streak: number;
  mean_meal_streak: number;
}

export interface CreateGroupData {
  name: string;
  description: string;
  photo?: File;
}

export interface CreateGroupLikeAdminData {
  name: string;
  description: string;
  group_id: number;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  photo?: File;
}

export interface UpdateMemberData {
  is_admin: boolean;
}

export interface InviteResponse {
  detail: string;
}

// Groups API Class
export class GroupsAPI {
  /**
   * List all groups for the current user
   */
  static async listMyGroups(): Promise<Group[]> {
    const response = await fetch(`/api/v1/groups/me`);

    if (!response.ok) {
      throw new Error("Erro ao buscar grupos");
    }

    return response.json();
  }

  /**
   * List all groups that is enterprise to admins
   */
  static async listGroupsAdmin(): Promise<Group[]> {
    const response = await fetch(`/api/v1/groups/admin`);

    if (!response.ok) {
      throw new Error("Erro ao buscar grupos");
    }

    return response.json();
  }
  /**
   * Get a specific group by ID with optional period filter
   */
  static async getGroup(groupId: number, period: "week" | "month" | "all" = "all"): Promise<Group> {
    const url = period !== "all" ? `/api/v1/groups/${groupId}?period=${period}` : `/api/v1/groups/${groupId}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao buscar grupo" }));
      throw new Error(error.detail || "Erro ao buscar grupo");
    }

    return response.json();
  }

  /**
   * Create a new group
   */
  static async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await fetch(`/api/v1/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao criar grupo" }));
      throw new Error(error.detail || "Erro ao criar grupo");
    }

    return response.json();
  }

  /**
   * Create a new group like admin
   * this is used when an admin system need create a group but not be part of it
   */
  static async createGroupLikeAdmin(data: CreateGroupLikeAdminData): Promise<Group> {
    const { group_id, ...body } = data;
    const response = await fetch(`/api/v1/groups/${group_id}/create-group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao criar grupo" }));
      throw new Error(error.detail || "Erro ao criar grupo");
    }

    return response.json();
  }

  /**
   * Update group information
   */
  static async updateGroup(groupId: number, data: UpdateGroupData): Promise<Group> {
    const formData = new FormData();

    if (data.name !== undefined) {
      formData.append("name", data.name);
    }

    if (data.description !== undefined) {
      formData.append("description", data.description);
    }

    if (data.photo) {
      formData.append("photo", data.photo);
    }

    const response = await fetch(`/api/v1/groups/${groupId}`, {
      method: "PATCH",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao atualizar grupo" }));
      throw new Error(error.detail || "Erro ao atualizar grupo");
    }

    return response.json();
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: number): Promise<void> {
    const response = await fetch(`/api/v1/groups/${groupId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao deletar grupo" }));
      throw new Error(error.detail || "Erro ao deletar grupo");
    }
  }

  /**
   * Invite a user to join the group
   */
  static async inviteUser(groupId: number, username: string): Promise<InviteResponse> {
    const response = await fetch(`/api/v1/groups/${groupId}/invite/${username}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao enviar convite" }));
      throw new Error(error.detail || "Erro ao enviar convite");
    }

    return response.json();
  }

  /**
   * Accept or reject a group invite
   */
  static async respondToInvite(groupId: number, action: "accept" | "reject"): Promise<InviteResponse> {
    const response = await fetch(`/api/v1/groups/${groupId}/accept-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao responder convite" }));
      throw new Error(error.detail || "Erro ao responder convite");
    }

    return response.json();
  }

  /**
   * Update a group member (e.g., change admin status)
   */
  static async updateMember(groupId: number, memberId: number, data: UpdateMemberData): Promise<GroupMember> {
    const response = await fetch(`/api/v1/groups/${groupId}/members/${memberId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao atualizar membro" }));
      throw new Error(error.detail || "Erro ao atualizar membro");
    }

    return response.json();
  }

  /**
   * Remove a member from the group
   */
  static async removeMember(groupId: number, memberId: number): Promise<void> {
    const response = await fetch(`/api/v1/groups/${groupId}/members/${memberId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao remover membro" }));
      throw new Error(error.detail || "Erro ao remover membro");
    }
  }

  /**
   * Leave a group
   */
  static async leaveGroup(groupId: number): Promise<InviteResponse> {
    const response = await fetch(`/api/v1/groups/${groupId}/quiting`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao sair do grupo" }));
      throw new Error(error.detail || "Erro ao sair do grupo");
    }

    return response.json();
  }
}
