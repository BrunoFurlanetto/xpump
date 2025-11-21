"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Plus, Trophy, Calendar, Target } from "lucide-react";
import { useMeals } from "@/hooks/useMeals";
import { MealLogModal } from "@/components/meals/meal-log-modal";
import { MealStats } from "@/components/meals/meal-stats";
import { DailyMealCard } from "@/components/meals/daily-meal-card";

export default function MealsPage() {
  const { dailyMeals, stats, mealTypes, isLoading, isSubmitting, createMeal, updateMeal, deleteMeal } = useMeals();

  const [showLogModal, setShowLogModal] = useState(false);

  const formatDateTitle = (dateString: string) => {
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return "Hoje";
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Minhas Refeições</h1>
          <p className="text-muted-foreground">Registre suas refeições e mantenha uma alimentação equilibrada</p>
        </div>

        <Button
          onClick={() => setShowLogModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Refeição
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && <MealStats stats={stats} />}

      {/* Progresso Diário */}
      {stats && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Target className="h-5 w-5 text-primary" />
              Meta Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Refeições registradas hoje</span>
                <span className="text-foreground font-medium">
                  {dailyMeals[0]?.meals ? Object.values(dailyMeals[0].meals).filter((m) => m !== null).length : 0}/4
                </span>
              </div>
              <Progress value={dailyMeals[0]?.completion_percentage || 0} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {dailyMeals[0]?.completion_percentage === 100
                    ? "🎉 Parabéns! Todas as refeições do dia registradas!"
                    : `Complete suas ${
                        4 -
                        (dailyMeals[0]?.meals ? Object.values(dailyMeals[0].meals).filter((m) => m !== null).length : 0)
                      } refeições restantes`}
                </span>
                {dailyMeals[0]?.total_points && (
                  <Badge variant="secondary" className="text-xs">
                    {dailyMeals[0].total_points} pontos hoje
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refeições por Dia */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Refeições
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyMeals.length === 0 ? (
            <div className="text-center py-8">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma refeição registrada</h3>
              <p className="text-muted-foreground mb-4">Comece registrando sua primeira refeição!</p>
              <Button
                onClick={() => setShowLogModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Refeição
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {dailyMeals.map((dayData) => (
                <div key={dayData.date} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground capitalize">
                      {formatDateTitle(dayData.date)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={dayData.completion_percentage === 100 ? "default" : "outline"}
                        className="text-xs"
                      >
                        {dayData.completion_percentage.toFixed(0)}% completo
                      </Badge>
                      {dayData.total_points > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          {dayData.total_points} pontos
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DailyMealCard
                    dayData={dayData}
                    mealTypes={mealTypes}
                    onAddMeal={() => setShowLogModal(true)}
                    onUpdateMeal={updateMeal}
                    onDeleteMeal={deleteMeal}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Registro */}
      <MealLogModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSubmit={createMeal}
        mealTypes={mealTypes}
        isLoading={isSubmitting}
      />
    </div>
  );
}
