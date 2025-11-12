export interface MealConfig {
  id: number;
  display_name: string;
  meal_name: string;
  interval_start: string;
  interval_end: string;
  description?: string;
}

export interface Meal {
  id: number;
  user: number;
  meal_type: number;
  meal_time: string;
  comments?: string;
  validation_status: number;
  base_points: number;
  multiplier: number;
  proofs?: Array<{
    id: number;
    file: string;
  }>;
  current_streak: number;
  longest_streak: number;
}

export interface CreateMealData {
  meal_type: number;
  meal_time: string;
  comments?: string;
  proof_files?: File[];
}

export interface MealChoice {
  value: string;
  label: string;
}

export interface MealStats {
  total_meals: number;
  total_points: number;
  this_week_meals: number;
  this_month_meals: number;
  streak_days: number;
  completion_rate: number;
}

export interface DailyMeals {
  date: string;
  meals: {
    [key: string]: Meal | null;
  };
  completion_percentage: number;
  total_points: number;
}

export class NutritionAPI {
  static async getMealConfigs(): Promise<MealConfig[]> {
    const response = await fetch(`/api/nutrition?endpoint=meal-type/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar tipos de refeição");
    }

    return response.json();
  }

  static async getMealChoices(): Promise<MealChoice[]> {
    const response = await fetch(`/api/nutrition?endpoint=meal-choices/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar opções de refeição");
    }

    return response.json();
  }

  static async getMeals(userId: number): Promise<Meal[]> {
    const response = await fetch(`/api/nutrition?endpoint=user/${userId}/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar refeições");
    }

    return response.json();
  }

  static async getMealsByDateRange(userId: number, startDate: string, endDate: string): Promise<Meal[]> {
    const response = await fetch(`/api/nutrition?endpoint=user/${userId}/${startDate}/${endDate}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar refeições");
    }

    return response.json();
  }

  static async createMeal(data: CreateMealData): Promise<Meal> {
    const formData = new FormData();

    formData.append("meal_type", data.meal_type.toString());
    formData.append("meal_time", data.meal_time);

    if (data.comments) {
      formData.append("comments", data.comments);
    }

    if (data.proof_files && data.proof_files.length > 0) {
      data.proof_files.forEach((file) => {
        formData.append("proof_files", file);
      });
    }

    const response = await fetch(`/api/nutrition`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Erro ao criar refeição" }));
      throw new Error(error.error || error.detail || "Erro ao criar refeição");
    }

    return response.json();
  }

  static async updateMeal(id: number, comments: string): Promise<Meal> {
    const response = await fetch(`/api/nutrition/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comments }),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar refeição");
    }

    return response.json();
  }

  static async deleteMeal(id: number): Promise<void> {
    const response = await fetch(`/api/nutrition/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar refeição");
    }
  }

  static groupMealsByDay(meals: Meal[], mealConfigs: MealConfig[]): DailyMeals[] {
    const grouped: { [key: string]: DailyMeals } = {};

    meals.forEach((meal) => {
      const date = new Date(meal.meal_time).toISOString().split("T")[0];

      if (!grouped[date]) {
        grouped[date] = {
          date,
          meals: {},
          completion_percentage: 0,
          total_points: 0,
        };

        // Initialize all meal types as null
        mealConfigs.forEach((config) => {
          grouped[date].meals[config.meal_name] = null;
        });
      }

      // Find the meal config for this meal
      const mealConfig = mealConfigs.find((c) => c.id === meal.meal_type);
      if (mealConfig) {
        grouped[date].meals[mealConfig.meal_name] = meal;
        grouped[date].total_points += meal.base_points * meal.multiplier;
      }
    });

    // Calculate completion percentage and sort by date
    return Object.values(grouped)
      .map((day) => {
        const totalMealTypes = mealConfigs.length;
        const completedMeals = Object.values(day.meals).filter((m) => m !== null).length;
        day.completion_percentage = totalMealTypes > 0 ? (completedMeals / totalMealTypes) * 100 : 0;
        return day;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static calculateStats(meals: Meal[]): MealStats {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Domingo
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekMeals = meals.filter((m) => new Date(m.meal_time) >= weekStart);

    const thisMonthMeals = meals.filter((m) => new Date(m.meal_time) >= monthStart);

    const totalPoints = meals.reduce((sum, m) => sum + m.base_points * m.multiplier, 0);

    // Calculate streak based on consecutive days with meals
    const streakDays = meals[0]?.current_streak || 0;

    // Calculate completion rate (simplified)
    const uniqueDays = new Set(meals.map((m) => new Date(m.meal_time).toISOString().split("T")[0])).size;

    const completionRate = uniqueDays > 0 ? Math.round((meals.length / (uniqueDays * 4)) * 100) : 0;

    return {
      total_meals: meals.length,
      total_points: Math.round(totalPoints),
      this_week_meals: thisWeekMeals.length,
      this_month_meals: thisMonthMeals.length,
      streak_days: streakDays,
      completion_rate: Math.min(completionRate, 100),
    };
  }
}
