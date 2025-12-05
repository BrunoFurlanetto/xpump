"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserAuth } from "@/context/userAuthContext";
import { NutritionAPI, Meal, MealConfig, MealStats, DailyMeals, CreateMealData } from "@/lib/api/nutrition";
import { profilesKeys } from "./useProfilesQuery";

export interface MealType {
  id: string;
  name: string;
  icon: string;
  timeRange: string;
  order: number;
}

// Re-export types from API
export type { Meal, MealConfig, MealStats, DailyMeals, CreateMealData } from "@/lib/api/nutrition";

// Query keys
export const mealsKeys = {
  all: ["meals"] as const,
  lists: () => [...mealsKeys.all, "list"] as const,
  list: (userId: number) => [...mealsKeys.lists(), userId] as const,
  configs: () => [...mealsKeys.all, "configs"] as const,
};

// Mapping from MealConfig to MealType for UI display
const getMealTypeIcon = (mealName: string): string => {
  const icons: { [key: string]: string } = {
    breakfast: "🌅",
    lunch: "🍽️",
    afternoon_snack: "🥪",
    dinner: "🌙",
    snack: "🍎",
  };
  return icons[mealName] || "🍽️";
};

// Hook to get meal configs
export function useMealConfigs() {
  return useQuery({
    queryKey: mealsKeys.configs(),
    queryFn: () => NutritionAPI.getMealConfigs(),
    staleTime: 1000 * 60 * 60, // 1 hour (configs rarely change)
  });
}

// Main hook to get meals with stats and daily breakdown
export function useMealsQuery(userId?: number) {
  const { user } = useUserAuth();
  const effectiveUserId = userId ?? (user?.id ? parseInt(user.id) : undefined);

  const { data: mealConfigs = [] } = useMealConfigs();

  const {
    data: meals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: mealsKeys.list(effectiveUserId!),
    queryFn: () => NutritionAPI.getMeals(effectiveUserId!),
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Calculate stats from meals
  const stats: MealStats | null = meals.length > 0 ? NutritionAPI.calculateStats(meals) : null;

  // Group meals by day
  const dailyMeals: DailyMeals[] =
    meals.length > 0 && mealConfigs.length > 0 ? NutritionAPI.groupMealsByDay(meals, mealConfigs) : [];

  // Convert MealConfigs to MealTypes for UI
  const mealTypes: MealType[] = mealConfigs.map((config, index) => ({
    id: config.id.toString(),
    name: config.display_name,
    icon: getMealTypeIcon(config.meal_name),
    timeRange: `${config.interval_start} - ${config.interval_end}`,
    order: index + 1,
  }));

  const getDayMeals = (date: string): DailyMeals | null => {
    return dailyMeals.find((day) => day.date === date) || null;
  };

  return {
    meals,
    dailyMeals,
    stats,
    mealTypes,
    mealConfigs,
    isLoading,
    error,
    getDayMeals,
  };
}

// Hook to create a meal
export function useCreateMeal() {
  const queryClient = useQueryClient();
  const { user } = useUserAuth();

  return useMutation({
    mutationFn: async (data: CreateMealData) => {
      const apiData: CreateMealData = {
        meal_type: data.meal_type,
        meal_time: data.meal_time,
        comments: data.comments,
        proof_files: data.proof_files,
      };

      const result = await NutritionAPI.createMeal(apiData);

      if (data.share_to_feed) {
        console.log("Compartilhando refeição no feed...");
        // TODO: Implementar compartilhamento no feed
      }

      return { result, share_to_feed: data.share_to_feed };
    },
    onSuccess: ({ share_to_feed }) => {
      const message = share_to_feed
        ? "Refeição registrada e compartilhada no feed! 🍽️📢"
        : "Refeição registrada com sucesso! 🍽️";

      toast.success(message);

      // Invalidate meals and profile queries to refresh data
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: mealsKeys.list(parseInt(user.id)) });
        queryClient.invalidateQueries({ queryKey: profilesKeys.all });
      }
    },
    onError: (error: Error) => {
      console.error("Erro ao criar refeição:", error);
      toast.error(error.message || "Erro ao registrar refeição");
    },
  });
}

// Hook to update a meal
export function useUpdateMeal() {
  const queryClient = useQueryClient();
  const { user } = useUserAuth();

  return useMutation({
    mutationFn: ({ id, comments }: { id: number; comments: string }) => NutritionAPI.updateMeal(id, comments),
    onSuccess: () => {
      toast.success("Comentário atualizado!");

      // Invalidate meals query to refresh data
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: mealsKeys.list(parseInt(user.id)) });
      }
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar refeição:", error);
      toast.error("Erro ao atualizar comentário");
    },
  });
}

// Hook to delete a meal
export function useDeleteMeal() {
  const queryClient = useQueryClient();
  const { user } = useUserAuth();

  return useMutation({
    mutationFn: (id: number) => NutritionAPI.deleteMeal(id),
    onSuccess: () => {
      toast.success("Refeição removida");

      // Invalidate meals and profile queries to refresh data
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: mealsKeys.list(parseInt(user.id)) });
        queryClient.invalidateQueries({ queryKey: profilesKeys.all });
      }
    },
    onError: (error: Error) => {
      console.error("Erro ao deletar refeição:", error);
      toast.error("Erro ao remover refeição");
    },
  });
}
