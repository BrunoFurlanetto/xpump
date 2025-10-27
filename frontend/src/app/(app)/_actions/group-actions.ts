"use server";

import { revalidatePath } from "next/cache";
import { groupsApi, CreateGroupData, Group } from "./groups";

/**
 * Server Action to create a new group
 * Can be called directly from Client Components
 */
export async function createGroupAction(
  data: CreateGroupData
): Promise<{ success: boolean; group?: Group; error?: string }> {
  try {
    const api = await groupsApi();
    const group = await api.create(data);

    // Revalidate the groups page to show the new group
    revalidatePath("/groups");

    return { success: true, group };
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar grupo",
    };
  }
}

/**
 * Server Action to invite a user to a group
 * Can be called directly from Client Components
 */
export async function inviteUserAction(
  groupId: number,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const api = await groupsApi();
    await api.inviteUser(groupId, username);

    // Revalidate the groups page
    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao convidar usuário:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao convidar usuário",
    };
  }
}

/**
 * Server Action to respond to a group invite
 * Can be called directly from Client Components
 */
export async function respondToInviteAction(
  groupId: number,
  action: "accept" | "reject"
): Promise<{ success: boolean; error?: string }> {
  try {
    const api = await groupsApi();
    await api.respondToInvite(groupId, action);

    // Revalidate the groups page
    revalidatePath("/groups");

    return { success: true };
  } catch (error) {
    console.error("Erro ao responder convite:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao responder convite",
    };
  }
}

/**
 * Server Action to leave a group
 * Can be called directly from Client Components
 */
export async function leaveGroupAction(groupId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const api = await groupsApi();
    await api.leave(groupId);

    // Revalidate the groups page
    revalidatePath("/groups");

    return { success: true };
  } catch (error) {
    console.error("Erro ao sair do grupo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao sair do grupo",
    };
  }
}

/**
 * Server Action to delete a group
 * Can be called directly from Client Components
 */
export async function deleteGroupAction(groupId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const api = await groupsApi();
    await api.delete(groupId);

    // Revalidate the groups page
    revalidatePath("/groups");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar grupo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao deletar grupo",
    };
  }
}

/**
 * Server Action to update a group
 * Can be called directly from Client Components
 */
export async function updateGroupAction(
  groupId: number,
  data: Partial<CreateGroupData>
): Promise<{ success: boolean; group?: Group; error?: string }> {
  try {
    const api = await groupsApi();
    const group = await api.update(groupId, data);

    // Revalidate the groups page and the specific group page
    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);

    return { success: true, group };
  } catch (error) {
    console.error("Erro ao atualizar grupo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar grupo",
    };
  }
}

/**
 * Server Action to remove a member from a group
 * Can be called directly from Client Components
 */
export async function removeMemberAction(
  groupId: number,
  memberId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const api = await groupsApi();
    await api.removeMember(groupId, memberId);

    // Revalidate the groups page and the specific group page
    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao remover membro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao remover membro",
    };
  }
}
