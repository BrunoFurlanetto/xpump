"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Calendar } from "lucide-react";
import { useMealsQuery } from "@/hooks/useMealsQuery";
import { DailyMealCard } from "@/components/meals/daily-meal-card";

interface TabMealsProps {
  userId: number;
  isOwnProfile: boolean;
}

export function TabMeals({ userId, isOwnProfile }: TabMealsProps) {
  const { dailyMeals, isLoading } = useMealsQuery(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (dailyMeals.length === 0) {
    return (
      <div className="text-center py-12">
        <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Nenhuma alimentação registrada</p>
      </div>
    );
  }

  const sortedDays = [...dailyMeals].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {sortedDays.map((dayData) => {
        const [year, month, day] = dayData.date.split("-").map(Number);
        const label = new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return (
          <div key={dayData.date} className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="capitalize font-medium text-foreground">{label}</span>
            </div>
            <DailyMealCard dayData={dayData} enabled={false} isOwnProfile={isOwnProfile} />
          </div>
        );
      })}
    </div>
  );
}
