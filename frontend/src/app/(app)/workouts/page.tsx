"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dumbbell, Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkoutsQuery, useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from "@/hooks/useWorkoutsQuery";
import { WorkoutCheckinModal } from "@/components/workouts/workout-checkin-modal";
import { DailyWorkoutCard } from "@/components/workouts/daily-workout-card";
import { useUserAuth } from "@/context/userAuthContext";

const MAX_DAILY_WORKOUTS = 4;

export default function WorkoutsPage() {
  const { user } = useUserAuth();
  const userId = user?.id ? parseInt(user.id) : null;

  const { data, isLoading } = useWorkoutsQuery(userId);
  const createWorkout = useCreateWorkout(userId!);
  const updateWorkout = useUpdateWorkout(userId!);
  const deleteWorkout = useDeleteWorkout(userId!);

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  });

  const workouts = data?.workouts || [];

  const formatDuration = (duration: string) => {
    const [hours, minutes] = duration.split(":");
    const h = parseInt(hours);
    const m = parseInt(minutes);

    if (h > 0) {
      return `${h}h${m > 0 ? ` ${m}min` : ""}`;
    }
    return `${m}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTitle = (dateString: string) => {
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
    const [year, month, day] = selectedDate.split("-").map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const isToday = () => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const compareDate = new Date(year, month - 1, day);
    compareDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return compareDate.getTime() === today.getTime();
  };

  const filteredWorkouts = workouts
    .filter((workout) => {
      const workoutDate = workout.workout_date.split("T")[0];
      return workoutDate === selectedDate;
    })
    .slice(0, MAX_DAILY_WORKOUTS);

  const canAddWorkout = isToday() && filteredWorkouts.length < MAX_DAILY_WORKOUTS;

  const handleCreateWorkout = async (workoutData: any) => {
    await createWorkout.mutateAsync(workoutData);
    setShowCheckinModal(false);
  };

  const handleUpdateWorkout = async (id: number, comments: string) => {
    await updateWorkout.mutateAsync({ workoutId: id, comments });
  };

  const handleDeleteWorkout = async (id: number) => {
    await deleteWorkout.mutateAsync(id);
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
                <Skeleton className="h-24 w-full" />
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meus Treinos</h1>
          <p className="text-muted-foreground">Registre seus treinos e acompanhe seu progresso</p>
        </div>

        <Button
          onClick={() => setShowCheckinModal(true)}
          disabled={!canAddWorkout}
          className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Treino
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
        </CardContent>
      </Card>

      {/* Histórico de Treinos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="capitalize">{formatDateTitle(selectedDate)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWorkouts.length === 0 && !isToday() ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum treino registrado</h3>
              <p className="text-muted-foreground">Nenhum treino foi registrado neste dia.</p>
            </div>
          ) : (
            <DailyWorkoutCard
              workouts={filteredWorkouts}
              onAddWorkout={() => setShowCheckinModal(true)}
              onUpdateComments={handleUpdateWorkout}
              onDelete={handleDeleteWorkout}
              formatDate={formatDate}
              formatDuration={formatDuration}
              enabled={isToday()}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de Check-in */}
      <WorkoutCheckinModal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        onSubmit={handleCreateWorkout}
        isLoading={createWorkout.isPending}
      />
    </div>
  );
}
