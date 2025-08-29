"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dumbbell, 
  Plus, 
  Trophy, 
  Flame, 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { useWorkouts } from '@/hooks/useWorkouts';
import { WorkoutCheckinModal } from '@/components/workouts/workout-checkin-modal';
import { WorkoutCard } from '@/components/workouts/workout-card';
import { WorkoutStats } from '@/components/workouts/workout-stats';

export default function WorkoutsPage() {
  const { 
    workouts, 
    streak, 
    stats, 
    isLoading, 
    isSubmitting,
    createWorkout,
    updateWorkout,
    deleteWorkout 
  } = useWorkouts();
  
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  const formatDuration = (duration: string) => {
    const [hours, minutes] = duration.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);
    
    if (h > 0) {
      return `${h}h${m > 0 ? ` ${m}min` : ''}`;
    }
    return `${m}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Treino
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && <WorkoutStats stats={stats} streak={streak} />}

      {/* Progresso Semanal */}
      {stats && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Target className="h-5 w-5 text-primary" />
              Meta Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Treinos realizados esta semana</span>
                <span className="text-foreground font-medium">{stats.this_week_workouts}/3</span>
              </div>
              <Progress 
                value={(stats.this_week_workouts / 3) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {stats.this_week_workouts >= 3 
                  ? "🎉 Parabéns! Meta semanal atingida!" 
                  : `Faltam ${3 - stats.this_week_workouts} treinos para completar sua meta`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Treinos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Treinos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum treino registrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece registrando seu primeiro treino!
              </p>
              <Button 
                onClick={() => setShowCheckinModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeiro Treino
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onUpdateComments={updateWorkout}
                  onDelete={deleteWorkout}
                  formatDate={formatDate}
                  formatDuration={formatDuration}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Check-in */}
      <WorkoutCheckinModal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        onSubmit={createWorkout}
        isLoading={isSubmitting}
      />
    </div>
  );
}
