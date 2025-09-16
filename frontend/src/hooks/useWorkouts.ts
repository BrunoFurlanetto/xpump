"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface WorkoutCheckin {
  id: number;
  user: number;
  location?: string;
  comments: string;
  workout_date: string;
  duration: string; // formato HH:MM:SS
  validation_status: number;
  base_points: number;
  multiplier: number;
  proof_image?: string;
  created_at: string;
}

export interface WorkoutStreak {
  id: number;
  user: number;
  current_streak: number;
  longest_streak: number;
  last_workout_datetime?: string;
  frequency: number;
}

export interface WorkoutStats {
  total_workouts: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  this_week_workouts: number;
  this_month_workouts: number;
  avg_duration_minutes: number;
}

interface UseWorkoutsReturn {
  workouts: WorkoutCheckin[];
  streak: WorkoutStreak | null;
  stats: WorkoutStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  createWorkout: (data: CreateWorkoutData) => Promise<void>;
  updateWorkout: (id: number, comments: string) => Promise<void>;
  deleteWorkout: (id: number) => Promise<void>;
  refreshWorkouts: () => Promise<void>;
}

export interface CreateWorkoutData {
  location?: string;
  comments: string;
  workout_date: string;
  duration: string; // formato HH:MM:SS
  proof_image?: File;
  share_to_feed?: boolean;
}

export function useWorkouts(): UseWorkoutsReturn {
  const [workouts, setWorkouts] = useState<WorkoutCheckin[]>([]);
  const [streak, setStreak] = useState<WorkoutStreak | null>(null);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkouts = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implementar chamadas para API real
      // Por enquanto, dados mock para desenvolvimento
      const mockWorkouts: WorkoutCheckin[] = [
        {
          id: 1,
          user: 1,
          location: "Academia Central",
          comments: "Treino de peito e tríceps. Ótima sessão!",
          workout_date: "2025-08-29T07:30:00Z",
          duration: "01:15:00",
          validation_status: 1,
          base_points: 87.5,
          multiplier: 1.25,
          created_at: "2025-08-29T07:30:00Z"
        },
        {
          id: 2,
          user: 1,
          location: "Casa",
          comments: "Treino funcional em casa",
          workout_date: "2025-08-27T18:00:00Z",
          duration: "00:45:00",
          validation_status: 1,
          base_points: 67.5,
          multiplier: 1.25,
          created_at: "2025-08-27T18:00:00Z"
        }
      ];

      const mockStreak: WorkoutStreak = {
        id: 1,
        user: 1,
        current_streak: 5,
        longest_streak: 12,
        last_workout_datetime: "2025-08-29T07:30:00Z",
        frequency: 3
      };

      const mockStats: WorkoutStats = {
        total_workouts: 24,
        total_points: 1840,
        current_streak: 5,
        longest_streak: 12,
        this_week_workouts: 3,
        this_month_workouts: 8,
        avg_duration_minutes: 65
      };

      setWorkouts(mockWorkouts);
      setStreak(mockStreak);
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao buscar workouts:', error);
      toast.error('Erro ao carregar treinos');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkout = async (data: CreateWorkoutData) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Implementar upload de imagem e chamada para API
      console.log('Criando workout:', data);
      
      if (data.share_to_feed) {
        console.log('Compartilhando treino no feed...');
        // TODO: Implementar compartilhamento no feed
      }
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const message = data.share_to_feed 
        ? 'Treino registrado e compartilhado no feed! 🎉📢' 
        : 'Treino registrado com sucesso! 🎉';
      
      toast.success(message);
      await fetchWorkouts(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao criar workout:', error);
      toast.error('Erro ao registrar treino');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWorkout = async (id: number, comments: string) => {
    try {
      // TODO: Implementar chamada para API
      console.log('Atualizando workout:', id, comments);
      
      setWorkouts(prev => 
        prev.map(workout => 
          workout.id === id 
            ? { ...workout, comments }
            : workout
        )
      );
      
      toast.success('Comentário atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar workout:', error);
      toast.error('Erro ao atualizar comentário');
      throw error;
    }
  };

  const deleteWorkout = async (id: number) => {
    try {
      // TODO: Implementar chamada para API
      console.log('Deletando workout:', id);
      
      setWorkouts(prev => prev.filter(workout => workout.id !== id));
      toast.success('Treino removido');
    } catch (error) {
      console.error('Erro ao deletar workout:', error);
      toast.error('Erro ao remover treino');
      throw error;
    }
  };

  const refreshWorkouts = async () => {
    await fetchWorkouts();
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return {
    workouts,
    streak,
    stats,
    isLoading,
    isSubmitting,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refreshWorkouts
  };
}
