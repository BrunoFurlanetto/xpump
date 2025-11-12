"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useUserAuth } from "@/context/userAuthContext";
import { NutritionAPI, Meal, MealConfig, MealStats, DailyMeals } from "@/lib/api/nutrition";

export interface MealType {
  id: string;
  name: string;
  icon: string;
  timeRange: string;
  order: number;
}

export interface MealLog {
  id: number;
  user: number;
  meal_type: string;
  meal_date: string;
  comments: string;
  photo?: string;
  validation_status: number;
  points: number;
  created_at: string;
}

interface UseMealsReturn {
  meals: Meal[];
  dailyMeals: DailyMeals[];
  stats: MealStats | null;
  mealTypes: MealType[];
  mealConfigs: MealConfig[];
  isLoading: boolean;
  isSubmitting: boolean;
  createMeal: (data: CreateMealData) => Promise<void>;
  updateMeal: (id: number, comments: string) => Promise<void>;
  deleteMeal: (id: number) => Promise<void>;
  refreshMeals: () => Promise<void>;
  getDayMeals: (date: string) => DailyMeals | null;
}

export interface CreateMealData {
  meal_type: number;
  meal_time: string;
  comments?: string;
  photo?: File;
  share_to_feed?: boolean;
}

// Re-export types from API
export type { Meal, MealConfig, MealStats, DailyMeals } from "@/lib/api/nutrition";

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

export function useMeals(): UseMealsReturn {
  const { user } = useUserAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealConfigs, setMealConfigs] = useState<MealConfig[]>([]);
  const [dailyMeals, setDailyMeals] = useState<DailyMeals[]>([]);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert MealConfigs to MealTypes for UI
  const mealTypes: MealType[] = mealConfigs.map((config, index) => ({
    id: config.id.toString(),
    name: config.display_name,
    icon: getMealTypeIcon(config.meal_name),
    timeRange: `${config.interval_start} - ${config.interval_end}`,
    order: index + 1,
  }));

  const fetchMeals = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch meal configs and meals in parallel
      const [configsData, mealsData] = await Promise.all([
        NutritionAPI.getMealConfigs(),
        NutritionAPI.getMeals(parseInt(user.id)),
      ]);

      setMealConfigs(configsData);
      setMeals(mealsData);

      // Calculate stats from meals
      const calculatedStats = NutritionAPI.calculateStats(mealsData);
      setStats(calculatedStats);

      // Group meals by day
      const groupedMeals = NutritionAPI.groupMealsByDay(mealsData, configsData);
      setDailyMeals(groupedMeals);
    } catch (error) {
      console.error("Erro ao buscar refeições:", error);
      toast.error("Erro ao carregar refeições");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const createMeal = async (data: CreateMealData) => {
    try {
      setIsSubmitting(true);

      const apiData = {
        meal_type: data.meal_type,
        meal_time: data.meal_time,
        comments: data.comments,
        proof_files: data.photo ? [data.photo] : undefined,
      };

      await NutritionAPI.createMeal(apiData);

      if (data.share_to_feed) {
        console.log("Compartilhando refeição no feed...");
        // TODO: Implementar compartilhamento no feed
      }

      const message = data.share_to_feed
        ? "Refeição registrada e compartilhada no feed! 🍽️📢"
        : "Refeição registrada com sucesso! 🍽️";

      toast.success(message);
      await fetchMeals(); // Reload data
    } catch (error) {
      console.error("Erro ao criar refeição:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao registrar refeição";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMeal = async (id: number, comments: string) => {
    try {
      await NutritionAPI.updateMeal(id, comments);

      setMeals((prev) => prev.map((meal) => (meal.id === id ? { ...meal, comments } : meal)));

      toast.success("Comentário atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar refeição:", error);
      toast.error("Erro ao atualizar comentário");
      throw error;
    }
  };

  const deleteMeal = async (id: number) => {
    try {
      await NutritionAPI.deleteMeal(id);

      setMeals((prev) => prev.filter((meal) => meal.id !== id));
      toast.success("Refeição removida");

      // Recalculate after deletion
      await fetchMeals();
    } catch (error) {
      console.error("Erro ao deletar refeição:", error);
      toast.error("Erro ao remover refeição");
      throw error;
    }
  };

  const refreshMeals = async () => {
    await fetchMeals();
  };

  const getDayMeals = (date: string): DailyMeals | null => {
    return dailyMeals.find((day) => day.date === date) || null;
  };

  useEffect(() => {
    if (user?.id) {
      fetchMeals();
    }
  }, [user?.id, fetchMeals]);

  return {
    meals,
    dailyMeals,
    stats,
    mealTypes,
    mealConfigs,
    isLoading,
    isSubmitting,
    createMeal,
    updateMeal,
    deleteMeal,
    refreshMeals,
    getDayMeals,
  };
}
