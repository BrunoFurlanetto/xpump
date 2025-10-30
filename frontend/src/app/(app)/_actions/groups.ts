"use server";

import { authFetch } from "@/lib/auth-fetch";
import { BACKEND_URL } from "@/lib/constants";
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
  action: "accept" | "reject";
}

// API Functions
export const groupsApi = async () => ({
  // List all groups - Uses authFetchWithRetry for proper token refresh in Server Actions
  async list() {
    const response = await authFetch(`${BACKEND_URL}/groups/me`);
    if (!response.ok) {
      return {
        error: "Falha ao carregar grupos",
        groups: [] as Group[],
      };
    }

    return {
      groups: (await response.json()) as Group[],
    };
  },

  // Get single group - Uses authFetchWithRetry for proper token refresh in Server Actions
  async get(groupId: number): Promise<Group> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/`, {
      method: "GET",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch group");
    }

    return response.json();
  },

  // Create new group
  async create(data: CreateGroupData): Promise<Group> {
    const response = await authFetch(`${BACKEND_URL}/groups/`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create group");
    }

    return response.json();
  },

  // Update group
  async update(groupId: number, data: Partial<CreateGroupData>): Promise<Group> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update group");
    }

    return response.json();
  },

  // Delete group
  async delete(groupId: number): Promise<void> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete group");
    }
  },

  // Invite user to group
  async inviteUser(groupId: number, username: string): Promise<{ detail: string }> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/invite/${username}/`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to invite user");
    }

    return response.json();
  },

  // Accept or reject invite
  async respondToInvite(groupId: number, action: "accept" | "reject"): Promise<{ detail: string }> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/accept-invite/`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to respond to invite");
    }

    return response.json();
  },

  // Update member (change admin status)
  async updateMember(groupId: number, memberId: number, data: UpdateMemberData): Promise<GroupMember> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/members/${memberId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update member");
    }

    return response.json();
  },

  // Remove member from group
  async removeMember(groupId: number, memberId: number): Promise<void> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/members/${memberId}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to remove member");
    }
  },

  // Leave group
  async leave(groupId: number): Promise<{ detail: string }> {
    const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/quiting/`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to leave group");
    }

    return response.json();
  },
});
