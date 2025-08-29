"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Flame, 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Dumbbell
} from 'lucide-react';
import { WorkoutStats as WorkoutStatsType, WorkoutStreak } from '@/hooks/useWorkouts';

interface WorkoutStatsProps {
  stats: WorkoutStatsType;
  streak: WorkoutStreak | null;
}

export function WorkoutStats({ stats, streak }: WorkoutStatsProps) {
  const getStreakBadgeColor = (currentStreak: number) => {
    if (currentStreak >= 10) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (currentStreak >= 5) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (currentStreak >= 3) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Treinos */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Treinos</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_workouts}</p>
            </div>
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Sequência Atual */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sequência Atual</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{stats.current_streak}</p>
                <Badge variant="outline" className={getStreakBadgeColor(stats.current_streak)}>
                  <Flame className="h-3 w-3 mr-1" />
                  {stats.current_streak >= 10 ? 'Lenda!' : 
                   stats.current_streak >= 5 ? 'Ótimo!' :
                   stats.current_streak >= 3 ? 'Bom!' : 'Início'}
                </Badge>
              </div>
            </div>
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* Pontos Totais */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pontos Totais</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_points.toLocaleString()}</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      {/* Duração Média */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duração Média</p>
              <p className="text-2xl font-bold text-foreground">{stats.avg_duration_minutes}min</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
