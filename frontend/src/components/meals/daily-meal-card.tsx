"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DailyMeals, Meal, MealType, useMealsQuery } from "@/hooks/useMealsQuery";
import { MealCard } from "./meal-card";
import { MealLogModal } from "./meal-log-modal";
import { useState } from "react";

interface DailyMealCardProps {
  dayData: DailyMeals;
  enabled?: boolean;
  isOwnProfile?: boolean;
}

interface MealSlotProps {
  mealTypeInfo: MealType;
  meal: Meal | null | undefined;
  enabled: boolean;
  isOwnProfile: boolean;
}

function MealSlot({ mealTypeInfo, meal, enabled, isOwnProfile }: MealSlotProps) {
  const [showLogModal, setShowLogModal] = useState(false);

  if (meal) {
    return <MealCard meal={meal} mealType={mealTypeInfo} isOwnProfile={isOwnProfile} />;
  }

  if (!enabled) return;

  return (
    <>
      <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <span className="text-lg">{mealTypeInfo.icon}</span>
            </div>
            <div>
              <h4 className="font-medium text-foreground">{mealTypeInfo.name}</h4>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!enabled}
            onClick={() => setShowLogModal(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <MealLogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} mealType={mealTypeInfo} />
    </>
  );
}

export function DailyMealCard({ dayData, enabled = true, isOwnProfile = true }: DailyMealCardProps) {
  const { mealTypes } = useMealsQuery();

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mealTypes
            .sort((a, b) => a.order - b.order)
            .map((mealType) => {
              const meal = Object.values(dayData.meals).find((m) => m && m.meal_type.toString() === mealType.id);
              return (
                <div key={mealType.id}>
                  <MealSlot mealTypeInfo={mealType} meal={meal} enabled={enabled} isOwnProfile={isOwnProfile} />
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
