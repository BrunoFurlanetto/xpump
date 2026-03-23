"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, Calendar } from "lucide-react";
import { useWorkoutsQuery } from "@/hooks/useWorkoutsQuery";
import { DailyWorkoutCard } from "@/components/workouts/daily-workout-card";

interface TabWorkoutsProps {
  userId: number;
  isOwnProfile: boolean;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDuration = (duration: string) => {
  const [hours, minutes] = duration.split(":");
  const h = parseInt(hours);
  const m = parseInt(minutes);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  return `${m}min`;
};

const noop = async () => { };

export function TabWorkouts({ userId, isOwnProfile }: TabWorkoutsProps) {
  const { data, isLoading } = useWorkoutsQuery(userId);

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

  const workouts = data?.workouts ?? [];

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Nenhum treino registrado</p>
      </div>
    );
  }

  // Group workouts by date
  const byDate = workouts.reduce<Record<string, typeof workouts>>((acc, w) => {
    const date = w.workout_date.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(w);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const [year, month, day] = date.split("-").map(Number);
        const label = new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="capitalize font-medium text-foreground">{label}</span>
            </div>
            <DailyWorkoutCard
              workouts={byDate[date]}
              onAddWorkout={noop}
              onUpdateComments={noop}
              onDelete={noop}
              formatDate={formatDate}
              formatDuration={formatDuration}
              enabled={false}
              isOwnProfile={isOwnProfile}
            />
          </div>
        );
      })}
    </div>
  );
}
