"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkoutsAPI, WorkoutCheckin, CreateWorkoutData, WorkoutStats } from "@/lib/api/workouts";
import { toast } from "sonner";
import { profilesKeys } from "./useProfilesQuery";

// Query Keys
export const workoutsKeys = {
  all: ["workouts"] as const,
  lists: () => [...workoutsKeys.all, "list"] as const,
  list: (userId: number) => [...workoutsKeys.lists(), userId] as const,
  stats: (userId: number) => [...workoutsKeys.all, "stats", userId] as const,
};

export interface WorkoutStreak {
  id: number;
  user: number;
  current_streak: number;
  longest_streak: number;
  last_workout_datetime?: string;
  frequency: number;
}

/**
 * Hook para buscar workouts de um usuário
 */
export function useWorkoutsQuery(userId: number | null) {
  return useQuery({
    queryKey: workoutsKeys.list(userId!),
    queryFn: () => WorkoutsAPI.getWorkouts(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    select: (data) => {
      // Calcular stats e streak a partir dos workouts

      console.log("Workouts data:", data);
      const stats = WorkoutsAPI.calculateStats(data);

      let streak: WorkoutStreak | null = null;
      if (data.length > 0) {
        const firstWorkout = data[0];
        streak = {
          id: userId!,
          user: userId!,
          current_streak: firstWorkout.current_streak,
          longest_streak: firstWorkout.longest_streak,
          last_workout_datetime: firstWorkout.workout_date,
          frequency: 3,
        };
      } else {
        streak = {
          id: userId!,
          user: userId!,
          current_streak: 0,
          longest_streak: 0,
          frequency: 3,
        };
      }

      return {
        workouts: data,
        stats,
        streak,
      };
    },
  });
}

/**
 * Hook para criar um novo workout
 */
export function useCreateWorkout(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkoutData) => WorkoutsAPI.createWorkout(data),
    onSuccess: () => {
      // Invalidar workouts do usuário
      queryClient.invalidateQueries({ queryKey: workoutsKeys.list(userId) });

      // Invalidar profile para atualizar streaks e stats
      queryClient.invalidateQueries({ queryKey: profilesKeys.all });

      toast.success("Treino registrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar treino");
    },
  });
}

/**
 * Hook para atualizar comentários de um workout
 */
export function useUpdateWorkout(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workoutId, comments }: { workoutId: number; comments: string }) =>
      WorkoutsAPI.updateWorkout(workoutId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutsKeys.list(userId) });
      toast.success("Treino atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar treino");
    },
  });
}

/**
 * Hook para deletar um workout
 */
export function useDeleteWorkout(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutId: number) => WorkoutsAPI.deleteWorkout(workoutId),
    onSuccess: () => {
      // Invalidar workouts do usuário
      queryClient.invalidateQueries({ queryKey: workoutsKeys.list(userId) });

      // Invalidar profile para atualizar streaks e stats
      queryClient.invalidateQueries({ queryKey: profilesKeys.all });

      toast.success("Treino deletado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao deletar treino");
    },
  });
}
