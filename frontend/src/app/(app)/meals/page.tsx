"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMealsQuery, useCreateMeal, useUpdateMeal, useDeleteMeal } from "@/hooks/useMealsQuery";
import { MealLogModal } from "@/components/meals/meal-log-modal";
import { DailyMealCard } from "@/components/meals/daily-meal-card";

export default function MealsPage() {
  const { dailyMeals, mealTypes, isLoading } = useMealsQuery();
  const createMealMutation = useCreateMeal();
  const updateMealMutation = useUpdateMeal();
  const deleteMealMutation = useDeleteMeal();

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  });
  const [visibleDays, setVisibleDays] = useState(7);

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

  const handleDateChange = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const isToday = () => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    return compareDate.getTime() === today.getTime();
  };

  const filteredDailyMeals = dailyMeals.filter((day) => {
    const dayDate = new Date(day.date);
    const endDate = new Date(selectedDate);
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - (visibleDays - 1));

    return dayDate >= startDate && dayDate <= endDate;
  });

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
          className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Refeição
        </Button>
      </div>

      {/* Calendário de Navegação */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDateChange(-1)}
              className="border-border text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="flex-1 bg-background border-border text-center justify-center text-foreground [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDateChange(1)}
              disabled={isToday()}
              className="border-border text-foreground hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isToday() && (
            <p className="text-xs text-muted-foreground text-center mt-2">Você só pode adicionar refeições para hoje</p>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {/* {stats && <MealStats stats={stats} />} */}

      {/* Progresso Diário */}
      {/* {stats && ( */}
      {/*   <Card className="bg-card border-border"> */}
      {/*     <CardHeader> */}
      {/*       <CardTitle className="flex items-center gap-2 text-foreground"> */}
      {/*         <Target className="h-5 w-5 text-primary" /> */}
      {/*         Meta Diária */}
      {/*       </CardTitle> */}
      {/*     </CardHeader> */}
      {/*     <CardContent> */}
      {/*       <div className="space-y-3"> */}
      {/*         <div className="flex justify-between text-sm"> */}
      {/*           <span className="text-muted-foreground">Refeições registradas {isToday() ? 'hoje' : 'no dia'}</span> */}
      {/*           <span className="text-foreground font-medium"> */}
      {/*             {filteredDailyMeals[filteredDailyMeals.length - 1]?.meals ? Object.values(filteredDailyMeals[filteredDailyMeals.length - 1].meals).filter((m) => m !== null).length : 0}/ */}
      {/*             {mealTypes.length} */}
      {/*           </span> */}
      {/*         </div> */}
      {/*         <Progress value={filteredDailyMeals[filteredDailyMeals.length - 1]?.completion_percentage || 0} className="h-2" /> */}
      {/*         <div className="flex items-center justify-between text-xs"> */}
      {/*           <span className="text-muted-foreground"> */}
      {/*             {filteredDailyMeals[filteredDailyMeals.length - 1]?.completion_percentage === 100 */}
      {/*               ? "🎉 Parabéns! Todas as refeições do dia registradas!" */}
      {/*               : `${ */}
      {/*                   mealTypes.length - */}
      {/*                   (filteredDailyMeals[filteredDailyMeals.length - 1]?.meals ? Object.values(filteredDailyMeals[filteredDailyMeals.length - 1].meals).filter((m) => m !== null).length : 0) */}
      {/*                 } refeições restantes`} */}
      {/*           </span> */}
      {/*         </div> */}
      {/*         {filteredDailyMeals[filteredDailyMeals.length - 1]?.total_points && ( */}
      {/*           <Badge variant="secondary" className="text-xs"> */}
      {/*             {filteredDailyMeals[filteredDailyMeals.length - 1].total_points} pontos {isToday() ? 'hoje' : 'no dia'} */}
      {/*           </Badge> */}
      {/*         )} */}
      {/*       </div> */}
      {/*     </CardContent> */}
      {/*   </Card> */}
      {/* )} */}

      {/* Refeições por Dia */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Refeições
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground capitalize">{formatDateTitle(selectedDate)}</h3>
              </div>

              <DailyMealCard
                dayData={
                  filteredDailyMeals
                    .slice()
                    .reverse()
                    .map((day) => ({
                      ...day,
                      meals: Object.fromEntries(
                        mealTypes.map((type) => {
                          const meal = Object.values(day.meals).find((m) => m && m.meal_type.toString() === type.id);
                          return [type.id, meal || null];
                        }),
                      ),
                    }))[0] || {
                    date: selectedDate,
                    meals: Object.fromEntries(mealTypes.map((type) => [type.id, null])),
                  }
                }
                mealTypes={mealTypes}
                onAddMeal={() => setShowLogModal(true)}
                onUpdateMeal={async (id, comments) => {
                  await updateMealMutation.mutateAsync({ id, comments });
                }}
                onDeleteMeal={async (id) => {
                  await deleteMealMutation.mutateAsync(id);
                }}
                enabled={isToday()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Registro */}
      <MealLogModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSubmit={async (data) => {
          await createMealMutation.mutateAsync(data);
          setShowLogModal(false);
        }}
        mealTypes={mealTypes}
        isLoading={createMealMutation.isPending}
      />
    </div>
  );
}
