"use client";

import { useState } from 'react';
import { useActivityTimeline } from '@/hooks/useActivityTimeline';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity,
  Filter,
  Calendar,
  TrendingUp,
  Zap,
  Dumbbell,
  Utensils,
  Trophy,
  Users,
  Heart,
  Clock,
  Target,
  MoreHorizontal,
  Trash2
} from "lucide-react";

export default function ActivitiesPage() {
  const {
    activities,
    groupedActivities,
    isLoading,
    filter,
    setFilter,
    stats,
    getRelativeTime,
    getActivityIcon,
    deleteActivity,
    clearOldActivities
  } = useActivityTimeline();

  const [showFilters, setShowFilters] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filterOptions = [
    { value: 'all', label: 'Todas', icon: Activity, count: stats.total },
    { value: 'workout', label: 'Treinos', icon: Dumbbell, count: stats.byType.workout },
    { value: 'meal', label: 'Refeições', icon: Utensils, count: stats.byType.meal },
    { value: 'achievement', label: 'Conquistas', icon: Trophy, count: stats.byType.achievement },
    { value: 'group', label: 'Grupos', icon: Users, count: stats.byType.group },
    { value: 'social', label: 'Social', icon: Heart, count: stats.byType.social },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Timeline de Atividades</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acompanhe todas suas atividades e progresso
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/20 text-primary">
            <Calendar className="h-3 w-3 mr-1" />
            {stats.today} hoje
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Atividades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground">Esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Target className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.today}</p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={filter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(option.value as 'all' | 'workout' | 'meal' | 'achievement' | 'group' | 'social')}
                    className="gap-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    {option.label}
                    <Badge variant="secondary" className="text-xs">
                      {option.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
            
            {Object.keys(groupedActivities).length > 7 && (
              <div className="flex justify-end mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearOldActivities}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar atividades antigas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedActivities).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Comece a treinar e registrar refeições para ver suas atividades aqui!'
                  : `Nenhuma atividade do tipo "${filterOptions.find(f => f.value === filter)?.label}" encontrada.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedActivities)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([date, dayActivities]) => (
              <div key={date} className="space-y-4">
                {/* Data */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="outline" className="text-xs">
                    {dayActivities.length} atividade{dayActivities.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Atividades do dia */}
                <div className="space-y-3 ml-6">
                  {dayActivities
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((activity) => (
                      <Card key={activity.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Ícone da atividade */}
                              <div className="p-2 rounded-full bg-muted/50 flex-shrink-0">
                                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                              </div>

                              {/* Conteúdo */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-foreground text-sm sm:text-base">
                                    {activity.title}
                                  </h3>
                                  {activity.points && (
                                    <Badge variant="outline" className="text-xs border-yellow-500/20 text-yellow-400">
                                      +{activity.points} pts
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                  {activity.description}
                                </p>

                                {/* Metadados */}
                                {activity.metadata && (
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {activity.metadata.duration && (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {activity.metadata.duration}min
                                      </div>
                                    )}
                                    {activity.metadata.calories && (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Zap className="h-3 w-3" />
                                        {activity.metadata.calories} cal
                                      </div>
                                    )}
                                    {activity.metadata.workoutType && (
                                      <Badge variant="secondary" className="text-xs">
                                        {activity.metadata.workoutType}
                                      </Badge>
                                    )}
                                    {activity.metadata.mealType && (
                                      <Badge variant="secondary" className="text-xs">
                                        {activity.metadata.mealType}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tempo e ações */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(activity.timestamp)}
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteActivity(activity.id)}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Footer com resumo */}
      {activities.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground">Resumo da Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.total} atividades registradas • {stats.totalPoints} pontos acumulados
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Média de {Math.round(stats.thisWeek / 7)} atividades por dia esta semana
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
