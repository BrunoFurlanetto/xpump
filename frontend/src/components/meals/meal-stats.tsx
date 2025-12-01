"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Utensils, TrendingUp, Flame, Target } from "lucide-react";
import { MealStats as MealStatsType } from "@/hooks/useMealsQuery";

interface MealStatsProps {
  stats: MealStatsType;
}

export function MealStats({ stats }: MealStatsProps) {
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-green-400";
    if (rate >= 60) return "text-yellow-400";
    if (rate >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getStreakBadgeColor = (streak: number) => {
    if (streak >= 7) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    if (streak >= 3) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (streak >= 1) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  // const getFavoriteMealType = () => {
  //   const favoriteType = mealTypes.find(type => type.id === stats.favorite_meal_type);
  //   return favoriteType ? `${favoriteType.icon} ${favoriteType.name}` : 'N/A';
  // };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Refeições */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Refeições</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_meals}</p>
            </div>
            <Utensils className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Sequência de Dias */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sequência de Dias</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{stats.streak_days}</p>
                <Badge variant="outline" className={getStreakBadgeColor(stats.streak_days)}>
                  <Flame className="h-3 w-3 mr-1" />
                  {stats.streak_days >= 7
                    ? "Incrível!"
                    : stats.streak_days >= 3
                    ? "Ótimo!"
                    : stats.streak_days >= 1
                    ? "Bom!"
                    : "Início"}
                </Badge>
              </div>
            </div>
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Completude */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taxa de Completude</p>
              <div className="flex items-center gap-1">
                <p className={`text-2xl font-bold ${getCompletionColor(stats.completion_rate)}`}>
                  {stats.completion_rate}%
                </p>
                <TrendingUp className={`h-4 w-4 ${getCompletionColor(stats.completion_rate)}`} />
              </div>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
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
    </div>
  );
}
