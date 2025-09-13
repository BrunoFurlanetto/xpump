"use client";

import { useState, useEffect } from 'react';

export interface GroupInvite {
  id: number;
  group: {
    id: number;
    name: string;
    description: string;
    memberCount: number;
  };
  invitedBy: {
    id: number;
    username: string;
    email: string;
  };
  role: 'member' | 'admin';
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface InviteUserData {
  userIds: number[];
  role: 'member' | 'admin';
}

export interface GroupInvitesResponse {
  invites: GroupInvite[];
  loading: boolean;
  error: string | null;
  fetchInvites: () => Promise<void>;
  sendInvites: (groupId: number, data: InviteUserData) => Promise<boolean>;
  respondToInvite: (inviteId: number, action: 'accept' | 'decline') => Promise<boolean>;
  updateMemberRole: (groupId: number, memberId: number, role: 'member' | 'admin') => Promise<boolean>;
  removeMember: (groupId: number, memberId: number) => Promise<boolean>;
}

export const useGroupInvites = (): GroupInvitesResponse => {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular chamada para API - substituir por endpoint real
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data para demonstração
      const mockInvites: GroupInvite[] = [
        {
          id: 1,
          group: {
            id: 1,
            name: "Equipe de Desenvolvimento",
            description: "Grupo para devs da empresa",
            memberCount: 12
          },
          invitedBy: {
            id: 2,
            username: "ana.oliveira",
            email: "ana@xpump.com"
          },
          role: 'member',
          createdAt: '2025-09-10T14:30:00Z',
          status: 'pending'
        },
        {
          id: 2,
          group: {
            id: 2,
            name: "Fitness Challenge 2025",
            description: "Desafio de fitness da empresa",
            memberCount: 25
          },
          invitedBy: {
            id: 3,
            username: "carlos.ferreira",
            email: "carlos@xpump.com"
          },
          role: 'admin',
          createdAt: '2025-09-09T09:15:00Z',
          status: 'pending'
        }
      ];
      
      setInvites(mockInvites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar convites:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendInvites = async (groupId: number, data: InviteUserData): Promise<boolean> => {
    try {
      console.log('Enviando convites para grupo', groupId, data);
      setError(null);
      
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em uma aplicação real, isso seria:
      // const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/invites/`, {
      //   method: 'POST',
      //   body: JSON.stringify(data),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Falha ao enviar convites');
      // }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao enviar convites:', err);
      return false;
    }
  };

  const respondToInvite = async (inviteId: number, action: 'accept' | 'decline'): Promise<boolean> => {
    try {
      setError(null);
      
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em uma aplicação real, isso seria:
      // const response = await authFetch(`${BACKEND_URL}/invites/${inviteId}/respond/`, {
      //   method: 'POST',
      //   body: JSON.stringify({ action }),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Falha ao responder convite');
      // }
      
      // Atualizar estado local
      setInvites(invites.map(invite => 
        invite.id === inviteId 
          ? { ...invite, status: action === 'accept' ? 'accepted' : 'declined' }
          : invite
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao responder convite:', err);
      return false;
    }
  };

  const updateMemberRole = async (groupId: number, memberId: number, role: 'member' | 'admin'): Promise<boolean> => {
    try {
      console.log(groupId)
      console.log('Atualizando papel do membro', memberId, 'para', role);
      setError(null);
      
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em uma aplicação real, isso seria:
      // const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/members/${memberId}/`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ is_admin: role === 'admin' }),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Falha ao atualizar papel do membro');
      // }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao atualizar papel do membro:', err);
      return false;
    }
  };

  const removeMember = async (groupId: number, memberId: number): Promise<boolean> => {
    try {
        console.log('Removendo membro', memberId, 'do grupo', groupId);
      setError(null);
      
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em uma aplicação real, isso seria:
      // const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/members/${memberId}/`, {
      //   method: 'DELETE',
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Falha ao remover membro');
      // }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao remover membro:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  return {
    invites,
    loading,
    error,
    fetchInvites,
    sendInvites,
    respondToInvite,
    updateMemberRole,
    removeMember,
  };
};
