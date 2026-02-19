"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Plus } from "lucide-react";
import { WorkoutCheckin } from "@/lib/api/workouts";
import { WorkoutCard } from "./workout-card";

const MAX_DAILY_WORKOUTS = 4;

const SLOT_LABELS = ["Treino 1", "Treino 2", "Treino 3", "Treino 4"];
const SLOT_ICONS = ["🏋️", "💪", "🔥", "⚡"];

interface DailyWorkoutCardProps {
  workouts: WorkoutCheckin[];
  onAddWorkout: () => void;
  onUpdateComments: (id: number, comments: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  formatDate: (date: string) => string;
  formatDuration: (duration: string) => string;
  enabled?: boolean;
}

export function DailyWorkoutCard({
  workouts,
  onAddWorkout,
  onUpdateComments,
  onDelete,
  formatDate,
  formatDuration,
  enabled = true,
}: DailyWorkoutCardProps) {
  const canAddMore = workouts.length < MAX_DAILY_WORKOUTS;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {SLOT_LABELS.map((label, index) => {
            const workout = workouts[index];

            if (workout) {
              return (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onUpdateComments={onUpdateComments}
                  onDelete={onDelete}
                  formatDate={formatDate}
                  formatDuration={formatDuration}
                />
              );
            }

            return (
              <div
                key={index}
                className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <span className="text-lg">{SLOT_ICONS[index]}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {index === 0 ? "Registre seu primeiro treino do dia" : "Slot disponível"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!enabled || !canAddMore}
                    onClick={onAddWorkout}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {!enabled && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Você só pode adicionar treinos para hoje
          </p>
        )}

        {enabled && !canAddMore && (
          <div className="flex items-center gap-2 justify-center pt-1">
            <Dumbbell className="h-4 w-4 text-primary" />
            <p className="text-xs text-primary font-medium">
              Limite de {MAX_DAILY_WORKOUTS} treinos por dia atingido!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
