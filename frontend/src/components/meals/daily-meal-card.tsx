"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Clock, 
  MessageSquare,
  MoreVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import { DailyMeals, MealType, MealLog } from '@/hooks/useMeals';
import { MealCard } from './meal-card';

interface DailyMealCardProps {
  dayData: DailyMeals;
  mealTypes: MealType[];
  onAddMeal: () => void;
  onUpdateMeal: (id: number, comments: string) => Promise<void>;
  onDeleteMeal: (id: number) => Promise<void>;
  formatDate: (date: string) => string;
}

export function DailyMealCard({ 
  dayData, 
  mealTypes, 
  onAddMeal, 
  onUpdateMeal, 
  onDeleteMeal, 
  formatDate 
}: DailyMealCardProps) {
  
  const getMealTypeInfo = (mealTypeId: string) => {
    return mealTypes.find(type => type.id === mealTypeId);
  };

  const renderMealSlot = (mealTypeId: string) => {
    const mealTypeInfo = getMealTypeInfo(mealTypeId);
    const meal = dayData.meals[mealTypeId];

    if (!mealTypeInfo) return null;

    if (meal) {
      return (
        <MealCard
          key={meal.id}
          meal={meal}
          mealType={mealTypeInfo}
          onUpdateComments={onUpdateMeal}
          onDelete={onDeleteMeal}
          formatDate={formatDate}
        />
      );
    }

    // Slot vazio para adicionar refeição
    return (
      <div 
        key={mealTypeId}
        className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <span className="text-lg">{mealTypeInfo.icon}</span>
            </div>
            <div>
              <h4 className="font-medium text-foreground">{mealTypeInfo.name}</h4>
              <p className="text-xs text-muted-foreground">{mealTypeInfo.timeRange}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddMeal}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mealTypes
            .sort((a, b) => a.order - b.order)
            .map(mealType => renderMealSlot(mealType.id))
          }
        </div>
      </CardContent>
    </Card>
  );
}
