// Types
export interface Group {
  id: number;
  name: string;
  description: string;
  created_by: number;
  owner: number;
  created_at: string;
  members: GroupMember[];
  main: boolean;
  pending: boolean;
}

export interface GroupMember {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  joined_at: string;
  pending: boolean;
}

export interface CreateGroupData {
  name: string;
  description: string;
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
    const response = await fetch(`/api/groups?endpoint=me`);

    if (!response.ok) {
      throw new Error("Erro ao buscar grupos");
    }

    return response.json();
  }

  /**
   * Get a single group by ID
   */
  static async getGroup(groupId: number): Promise<Group> {
    const response = await fetch(`/api/groups?endpoint=${groupId}/`);

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
    const response = await fetch(`/api/groups`, {
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
   * Update group information
   */
  static async updateGroup(groupId: number, data: Partial<CreateGroupData>): Promise<Group> {
    const response = await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
    const response = await fetch(`/api/groups/${groupId}`, {
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
    const response = await fetch(`/api/groups/${groupId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
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
    const response = await fetch(`/api/groups/${groupId}/respond`, {
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
    const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
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
    const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
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
    const response = await fetch(`/api/groups/${groupId}/leave`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao sair do grupo" }));
      throw new Error(error.detail || "Erro ao sair do grupo");
    }

    return response.json();
  }
}
