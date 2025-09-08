"use client";

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { BACKEND_URL } from '@/lib/constants';

export interface GroupMember {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  joined_at: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  created_by: number;
  owner: number;
  invite_code: string;
  created_at: string;
  members: GroupMember[];
}

export interface CreateGroupData {
  name: string;
  description: string;
}

export interface GroupsResponse {
  groups: Group[];
  loading: boolean;
  error: string | null;
  createGroup: (data: CreateGroupData) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<boolean>;
  leaveGroup: (groupId: number) => Promise<boolean>;
  fetchGroups: () => Promise<void>;
  updateGroup: (groupId: number, data: Partial<CreateGroupData>) => Promise<Group>;
  deleteGroup: (groupId: number) => Promise<boolean>;
}

export const useGroups = (): GroupsResponse => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(`${BACKEND_URL}/groups/`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar grupos');
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar grupos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (data: CreateGroupData): Promise<Group> => {
    try {
      setError(null);
      
      const response = await authFetch(`${BACKEND_URL}/groups/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao criar grupo');
      }
      
      const newGroup = await response.json();
      setGroups(prev => [...prev, newGroup]);
      
      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar grupo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const joinGroup = async (inviteCode: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await authFetch(`${BACKEND_URL}/groups/join/${inviteCode}/`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao entrar no grupo');
      }
      
      // Atualizar lista de grupos após entrar em um novo
      await fetchGroups();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao entrar no grupo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const leaveGroup = async (groupId: number): Promise<boolean> => {
    try {
      setError(null);
      
      // Nota: Esta endpoint precisará ser implementada no backend
      // Por enquanto, simular saída do grupo removendo da lista local
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao sair do grupo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateGroup = async (groupId: number, data: Partial<CreateGroupData>): Promise<Group> => {
    try {
      setError(null);
      
      const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao atualizar grupo');
      }
      
      const updatedGroup = await response.json();
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      
      return updatedGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar grupo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteGroup = async (groupId: number): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await authFetch(`${BACKEND_URL}/groups/${groupId}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao excluir grupo');
      }
      
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir grupo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    createGroup,
    joinGroup,
    leaveGroup,
    fetchGroups,
    updateGroup,
    deleteGroup,
  };
};
