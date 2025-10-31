"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUserAuth } from "@/context/userAuthContext";
import { WorkoutsAPI, WorkoutCheckin, WorkoutStats } from "@/lib/api/workouts";

export interface WorkoutStreak {
  id: number;
  user: number;
  current_streak: number;
  longest_streak: number;
  last_workout_datetime?: string;
  frequency: number;
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

// Re-export types from API for backward compatibility
export type { WorkoutCheckin, WorkoutStats } from "@/lib/api/workouts";

export function useWorkouts(): UseWorkoutsReturn {
  const { user } = useUserAuth();
  const [workouts, setWorkouts] = useState<WorkoutCheckin[]>([]);
  const [streak, setStreak] = useState<WorkoutStreak | null>(null);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkouts = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const workoutsData = await WorkoutsAPI.getWorkouts(parseInt(user.id));
      setWorkouts(workoutsData);

      // Calculate stats from workouts
      const calculatedStats = WorkoutsAPI.calculateStats(workoutsData);
      setStats(calculatedStats);

      // Create streak object from first workout
      if (workoutsData.length > 0) {
        const firstWorkout = workoutsData[0];
        setStreak({
          id: parseInt(user.id),
          user: parseInt(user.id),
          current_streak: firstWorkout.current_streak,
          longest_streak: firstWorkout.longest_streak,
          last_workout_datetime: firstWorkout.workout_date,
          frequency: 3, // Default frequency
        });
      } else {
        setStreak({
          id: parseInt(user.id),
          user: parseInt(user.id),
          current_streak: 0,
          longest_streak: 0,
          frequency: 3,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar workouts:", error);
      toast.error("Erro ao carregar treinos");
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkout = async (data: CreateWorkoutData) => {
    try {
      setIsSubmitting(true);

      const apiData = {
        location: data.location,
        comments: data.comments,
        workout_date: data.workout_date,
        duration: data.duration,
        proof_files: data.proof_image ? [data.proof_image] : undefined,
      };

      await WorkoutsAPI.createWorkout(apiData);

      if (data.share_to_feed) {
        console.log("Compartilhando treino no feed...");
        // TODO: Implementar compartilhamento no feed
      }

      const message = data.share_to_feed
        ? "Treino registrado e compartilhado no feed! 🎉📢"
        : "Treino registrado com sucesso! 🎉";

      toast.success(message);
      await fetchWorkouts(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao criar workout:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao registrar treino";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWorkout = async (id: number, comments: string) => {
    try {
      await WorkoutsAPI.updateWorkout(id, comments);

      setWorkouts((prev) => prev.map((workout) => (workout.id === id ? { ...workout, comments } : workout)));

      toast.success("Comentário atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar workout:", error);
      toast.error("Erro ao atualizar comentário");
      throw error;
    }
  };

  const deleteWorkout = async (id: number) => {
    try {
      await WorkoutsAPI.deleteWorkout(id);

      setWorkouts((prev) => prev.filter((workout) => workout.id !== id));
      toast.success("Treino removido");

      // Recalculate stats after deletion
      await fetchWorkouts();
    } catch (error) {
      console.error("Erro ao deletar workout:", error);
      toast.error("Erro ao remover treino");
      throw error;
    }
  };

  const refreshWorkouts = async () => {
    await fetchWorkouts();
  };

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts();
    }
  }, [user?.id]);

  return {
    workouts,
    streak,
    stats,
    isLoading,
    isSubmitting,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refreshWorkouts,
  };
}
