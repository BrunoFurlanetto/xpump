"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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

export interface MealStats {
  total_meals: number;
  total_points: number;
  this_week_meals: number;
  this_month_meals: number;
  streak_days: number;
  completion_rate: number; // % de refeições completas por dia
  favorite_meal_type: string;
}

export interface DailyMeals {
  date: string;
  meals: {
    [key: string]: MealLog | null; // breakfast, lunch, snack, dinner
  };
  completion_percentage: number;
  total_points: number;
}

interface UseMealsReturn {
  meals: MealLog[];
  dailyMeals: DailyMeals[];
  stats: MealStats | null;
  mealTypes: MealType[];
  isLoading: boolean;
  isSubmitting: boolean;
  createMeal: (data: CreateMealData) => Promise<void>;
  updateMeal: (id: number, comments: string) => Promise<void>;
  deleteMeal: (id: number) => Promise<void>;
  refreshMeals: () => Promise<void>;
  getDayMeals: (date: string) => DailyMeals | null;
}

export interface CreateMealData {
  meal_type: string;
  meal_date: string;
  comments: string;
  photo?: File;
}

// Tipos de refeição padrão do sistema
export const DEFAULT_MEAL_TYPES: MealType[] = [
  {
    id: 'breakfast',
    name: 'Café da Manhã',
    icon: '🌅',
    timeRange: '06:00 - 10:00',
    order: 1
  },
  {
    id: 'lunch',
    name: 'Almoço',
    icon: '🍽️',
    timeRange: '11:00 - 15:00',
    order: 2
  },
  {
    id: 'snack',
    name: 'Lanche',
    icon: '🥪',
    timeRange: '15:00 - 18:00',
    order: 3
  },
  {
    id: 'dinner',
    name: 'Jantar',
    icon: '🌙',
    timeRange: '18:00 - 22:00',
    order: 4
  }
];

export function useMeals(): UseMealsReturn {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [dailyMeals, setDailyMeals] = useState<DailyMeals[]>([]);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mealTypes = DEFAULT_MEAL_TYPES;

  const fetchMeals = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implementar chamadas para API real
      // Por enquanto, dados mock para desenvolvimento
      const mockMeals: MealLog[] = [
        {
          id: 1,
          user: 1,
          meal_type: 'breakfast',
          meal_date: '2025-08-29T08:00:00Z',
          comments: 'Aveia com frutas e mel. Começando o dia com energia!',
          points: 25,
          validation_status: 1,
          created_at: '2025-08-29T08:00:00Z'
        },
        {
          id: 2,
          user: 1,
          meal_type: 'lunch',
          meal_date: '2025-08-29T12:30:00Z',
          comments: 'Frango grelhado com salada e arroz integral',
          points: 30,
          validation_status: 1,
          created_at: '2025-08-29T12:30:00Z'
        },
        {
          id: 3,
          user: 1,
          meal_type: 'breakfast',
          meal_date: '2025-08-28T07:45:00Z',
          comments: 'Smoothie de banana com whey protein',
          points: 25,
          validation_status: 1,
          created_at: '2025-08-28T07:45:00Z'
        },
        {
          id: 4,
          user: 1,
          meal_type: 'dinner',
          meal_date: '2025-08-28T19:15:00Z',
          comments: 'Salmão grelhado com legumes no vapor',
          points: 35,
          validation_status: 1,
          created_at: '2025-08-28T19:15:00Z'
        }
      ];

      const mockStats: MealStats = {
        total_meals: 68,
        total_points: 1890,
        this_week_meals: 18,
        this_month_meals: 52,
        streak_days: 4,
        completion_rate: 75, // 75% das refeições diárias completas
        favorite_meal_type: 'breakfast'
      };

      // Organizar refeições por dia
      const mealsByDay = groupMealsByDay(mockMeals);

      setMeals(mockMeals);
      setDailyMeals(mealsByDay);
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao buscar refeições:', error);
      toast.error('Erro ao carregar refeições');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const groupMealsByDay = (mealsList: MealLog[]): DailyMeals[] => {
    const grouped: { [key: string]: DailyMeals } = {};

    mealsList.forEach(meal => {
      const date = new Date(meal.meal_date).toISOString().split('T')[0];
      
      if (!grouped[date]) {
        grouped[date] = {
          date,
          meals: {
            breakfast: null,
            lunch: null,
            snack: null,
            dinner: null
          },
          completion_percentage: 0,
          total_points: 0
        };
      }

      grouped[date].meals[meal.meal_type] = meal;
      grouped[date].total_points += meal.points;
    });

    // Calcular porcentagem de completude e ordenar por data
    return Object.values(grouped)
      .map(day => {
        const completedMeals = Object.values(day.meals).filter(meal => meal !== null).length;
        day.completion_percentage = (completedMeals / 4) * 100; // 4 refeições por dia
        return day;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const createMeal = async (data: CreateMealData) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Implementar upload de imagem e chamada para API
      console.log('Criando refeição:', data);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calcular pontos baseado no tipo de refeição
      const basePoints = {
        breakfast: 25,
        lunch: 30,
        snack: 20,
        dinner: 35
      };

      const newMeal: MealLog = {
        id: Date.now(),
        user: 1,
        meal_type: data.meal_type,
        meal_date: data.meal_date,
        comments: data.comments,
        points: basePoints[data.meal_type as keyof typeof basePoints] || 25,
        validation_status: 1,
        created_at: new Date().toISOString()
      };

      setMeals(prev => [newMeal, ...prev]);
      
      toast.success('Refeição registrada com sucesso! 🍽️');
      await fetchMeals(); // Recarregar para recalcular dados
    } catch (error) {
      console.error('Erro ao criar refeição:', error);
      toast.error('Erro ao registrar refeição');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMeal = async (id: number, comments: string) => {
    try {
      // TODO: Implementar chamada para API
      console.log('Atualizando refeição:', id, comments);
      
      setMeals(prev => 
        prev.map(meal => 
          meal.id === id 
            ? { ...meal, comments }
            : meal
        )
      );
      
      toast.success('Comentário atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error);
      toast.error('Erro ao atualizar comentário');
      throw error;
    }
  };

  const deleteMeal = async (id: number) => {
    try {
      // TODO: Implementar chamada para API
      console.log('Deletando refeição:', id);
      
      setMeals(prev => prev.filter(meal => meal.id !== id));
      toast.success('Refeição removida');
    } catch (error) {
      console.error('Erro ao deletar refeição:', error);
      toast.error('Erro ao remover refeição');
      throw error;
    }
  };

  const refreshMeals = async () => {
    await fetchMeals();
  };

  const getDayMeals = (date: string): DailyMeals | null => {
    return dailyMeals.find(day => day.date === date) || null;
  };

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return {
    meals,
    dailyMeals,
    stats,
    mealTypes,
    isLoading,
    isSubmitting,
    createMeal,
    updateMeal,
    deleteMeal,
    refreshMeals,
    getDayMeals
  };
}
