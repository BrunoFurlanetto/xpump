"use client";

import { useState, useEffect } from 'react';

export interface ActivityItem {
  id: string;
  type: 'workout' | 'meal' | 'achievement' | 'group' | 'social';
  title: string;
  description: string;
  timestamp: Date;
  points?: number;
  metadata?: {
    workoutType?: string;
    duration?: number;
    mealType?: string;
    calories?: number;
    achievementId?: string;
    groupName?: string;
    socialAction?: 'like' | 'comment' | 'follow' | 'join';
    targetUser?: string;
  };
}

// Mock de dados de atividades
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'workout',
    title: 'Treino de Peito e Tríceps',
    description: 'Completou treino de 45 minutos com foco em peito',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    points: 80,
    metadata: {
      workoutType: 'Musculação',
      duration: 45
    }
  },
  {
    id: '2',
    type: 'achievement',
    title: 'Primeira Sequência',
    description: 'Desbloqueou a conquista por completar 3 treinos seguidos',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
    points: 100,
    metadata: {
      achievementId: 'first-streak'
    }
  },
  {
    id: '3',
    type: 'meal',
    title: 'Almoço Saudável',
    description: 'Registrou refeição balanceada com 520 calorias',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
    points: 30,
    metadata: {
      mealType: 'Almoço',
      calories: 520
    }
  },
  {
    id: '4',
    type: 'group',
    title: 'Entrou no grupo "Corredores SP"',
    description: 'Se juntou a um grupo com 127 membros',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
    points: 25,
    metadata: {
      groupName: 'Corredores SP',
      socialAction: 'join'
    }
  },
  {
    id: '5',
    type: 'social',
    title: 'Curtiu treino de @carlos_fit',
    description: 'Interagiu com a comunidade',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 horas atrás
    points: 5,
    metadata: {
      socialAction: 'like',
      targetUser: 'carlos_fit'
    }
  },
  {
    id: '6',
    type: 'workout',
    title: 'Corrida Matinal',
    description: 'Corrida de 5km em 28 minutos',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    points: 60,
    metadata: {
      workoutType: 'Cardio',
      duration: 28
    }
  },
  {
    id: '7',
    type: 'meal',
    title: 'Café da Manhã Proteico',
    description: 'Omelete com aveia e frutas - 380 calorias',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
    points: 25,
    metadata: {
      mealType: 'Café da manhã',
      calories: 380
    }
  },
  {
    id: '8',
    type: 'achievement',
    title: 'Mestre da Consistência',
    description: 'Completou 7 dias seguidos de atividades',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
    points: 200,
    metadata: {
      achievementId: 'consistency-master'
    }
  },
  {
    id: '9',
    type: 'social',
    title: 'Comentou no post de @ana_fitness',
    description: 'Deu dicas de nutrição para a comunidade',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    points: 10,
    metadata: {
      socialAction: 'comment',
      targetUser: 'ana_fitness'
    }
  },
  {
    id: '10',
    type: 'workout',
    title: 'Treino HIIT',
    description: 'Treino intervalado de alta intensidade - 30min',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 dias atrás
    points: 90,
    metadata: {
      workoutType: 'HIIT',
      duration: 30
    }
  }
];

export const useActivityTimeline = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityItem['type'] | 'all'>('all');

  // Simular carregamento das atividades
  useEffect(() => {
    const loadActivities = () => {
      setTimeout(() => {
        setActivities(mockActivities);
        setIsLoading(false);
      }, 500);
    };

    loadActivities();
  }, []);

  // Filtrar atividades
  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  );

  // Agrupar atividades por data
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  // Estatísticas das atividades
  const stats = {
    total: activities.length,
    totalPoints: activities.reduce((sum, activity) => sum + (activity.points || 0), 0),
    byType: {
      workout: activities.filter(a => a.type === 'workout').length,
      meal: activities.filter(a => a.type === 'meal').length,
      achievement: activities.filter(a => a.type === 'achievement').length,
      group: activities.filter(a => a.type === 'group').length,
      social: activities.filter(a => a.type === 'social').length,
    },
    thisWeek: activities.filter(a => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return a.timestamp >= weekAgo;
    }).length,
    today: activities.filter(a => {
      const today = new Date().toDateString();
      return a.timestamp.toDateString() === today;
    }).length
  };

  // Funções utilitárias
  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else {
      return timestamp.toLocaleDateString('pt-BR');
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'workout':
        return '💪';
      case 'meal':
        return '🍽️';
      case 'achievement':
        return '🏆';
      case 'group':
        return '👥';
      case 'social':
        return '❤️';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'workout':
        return 'text-blue-400';
      case 'meal':
        return 'text-green-400';
      case 'achievement':
        return 'text-yellow-400';
      case 'group':
        return 'text-purple-400';
      case 'social':
        return 'text-pink-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const addActivity = (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setActivities(prev => [newActivity, ...prev]);
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const clearOldActivities = () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    setActivities(prev => prev.filter(activity => activity.timestamp >= weekAgo));
  };

  return {
    activities: filteredActivities,
    groupedActivities,
    isLoading,
    filter,
    setFilter,
    stats,
    
    // Utility functions
    getRelativeTime,
    getActivityIcon,
    getActivityColor,
    
    // Actions
    addActivity,
    deleteActivity,
    clearOldActivities,
  };
};
