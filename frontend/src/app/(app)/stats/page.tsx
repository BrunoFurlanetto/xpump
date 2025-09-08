"use client";

import { useWorkouts } from '@/hooks/useWorkouts';
import { useMeals } from '@/hooks/useMeals';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Flame,
  Clock,
  Zap,
  Award,
  Activity,
  Dumbbell,
  Utensils,
} from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

interface MonthlyData {
  month: string;
  workouts: number;
  meals: number;
  points: number;
}

export default function StatsPage() {
  const { stats: workoutStats, streak: workoutStreak } = useWorkouts();
  const { stats: mealStats } = useMeals();
  const { achievements } = useNotifications();

  // Dados mock para gráficos mensais
  const monthlyData: MonthlyData[] = [
    { month: 'Jan', workouts: 15, meals: 85, points: 1200 },
    { month: 'Fev', workouts: 18, meals: 92, points: 1400 },
    { month: 'Mar', workouts: 22, meals: 95, points: 1650 },
    { month: 'Abr', workouts: 20, meals: 88, points: 1500 },
    { month: 'Mai', workouts: 25, meals: 100, points: 1800 },
    { month: 'Jun', workouts: 28, meals: 105, points: 2000 },
  ];

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  
  // Calcular estatísticas combinadas
  const totalPoints = (workoutStats?.total_points || 0) + (mealStats?.total_points || 0);
  const avgWorkoutDuration = workoutStats?.avg_duration_minutes || 0;
  const completionRate = mealStats?.completion_rate || 0;
  const currentStreak = Math.max(workoutStreak?.current_streak || 0, mealStats?.streak_days || 0);

  const statCards: StatCard[] = [
    {
      title: "Pontos Totais",
      value: totalPoints.toLocaleString(),
      change: "+12%",
      trend: 'up',
      icon: Zap,
      color: "text-yellow-400"
    },
    {
      title: "Treinos Este Mês",
      value: workoutStats?.this_month_workouts || 0,
      change: "+8%",
      trend: 'up',
      icon: Dumbbell,
      color: "text-blue-400"
    },
    {
      title: "Refeições Este Mês",
      value: mealStats?.this_month_meals || 0,
      change: "+5%",
      trend: 'up',
      icon: Utensils,
      color: "text-green-400"
    },
    {
      title: "Sequência Atual",
      value: `${currentStreak} dias`,
      change: "+2 dias",
      trend: 'up',
      icon: Flame,
      color: "text-orange-400"
    },
    {
      title: "Duração Média",
      value: `${avgWorkoutDuration}min`,
      change: "+5min",
      trend: 'up',
      icon: Clock,
      color: "text-purple-400"
    },
    {
      title: "Taxa de Conclusão",
      value: `${Math.round(completionRate)}%`,
      change: completionRate > 75 ? "+3%" : "-2%",
      trend: completionRate > 75 ? 'up' : 'down',
      icon: Target,
      color: "text-pink-400"
    },
    {
      title: "Conquistas",
      value: unlockedAchievements.length,
      change: "+2 novas",
      trend: 'up',
      icon: Award,
      color: "text-indigo-400"
    },
    {
      title: "Rank Global",
      value: "#47",
      change: "+3 posições",
      trend: 'up',
      icon: TrendingUp,
      color: "text-cyan-400"
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Estatísticas</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acompanhe sua evolução e performance detalhada
          </p>
        </div>
        
        <Badge variant="outline" className="border-primary/20 text-primary w-fit">
          <Calendar className="h-4 w-4 mr-2" />
          Dados de Agosto 2025
        </Badge>
      </div>

      {/* Grid principal de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="bg-card border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  {getTrendIcon(stat.trend)}
                </div>
                
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p className={`text-xs ${getTrendColor(stat.trend)}`}>
                      {stat.change} vs mês anterior
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico de evolução mensal */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução dos Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Gráfico simples com barras */}
            <div className="space-y-4">
              <div className="flex justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded" />
                  <span className="text-muted-foreground">Treinos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded" />
                  <span className="text-muted-foreground">Refeições</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded" />
                  <span className="text-muted-foreground">Pontos (x10)</span>
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-2 h-48">
                {monthlyData.map((data) => {
                  const maxWorkouts = Math.max(...monthlyData.map(d => d.workouts));
                  const maxMeals = Math.max(...monthlyData.map(d => d.meals));
                  const maxPoints = Math.max(...monthlyData.map(d => d.points));
                  
                  return (
                    <div key={data.month} className="flex flex-col justify-end items-center gap-1">
                      <div className="flex items-end gap-1 h-40">
                        {/* Barra de treinos */}
                        <div
                          className="bg-blue-400 rounded-t min-w-[8px]"
                          style={{
                            height: `${(data.workouts / maxWorkouts) * 100}%`
                          }}
                        />
                        {/* Barra de refeições */}
                        <div
                          className="bg-green-400 rounded-t min-w-[8px]"
                          style={{
                            height: `${(data.meals / maxMeals) * 100}%`
                          }}
                        />
                        {/* Barra de pontos (dividido por 10 para escala) */}
                        <div
                          className="bg-yellow-400 rounded-t min-w-[8px]"
                          style={{
                            height: `${((data.points / 10) / (maxPoints / 10)) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{data.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Métricas do mês atual */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{monthlyData[monthlyData.length - 1]?.workouts}</p>
                <p className="text-sm text-muted-foreground">Treinos em Agosto</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{monthlyData[monthlyData.length - 1]?.meals}</p>
                <p className="text-sm text-muted-foreground">Refeições em Agosto</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{monthlyData[monthlyData.length - 1]?.points}</p>
                <p className="text-sm text-muted-foreground">Pontos em Agosto</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Análise de Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Análise de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Consistência de Treinos</span>
                <span className="text-foreground font-medium">
                  {Math.round((workoutStats?.this_month_workouts || 0) / 30 * 100)}%
                </span>
              </div>
              <Progress value={(workoutStats?.this_month_workouts || 0) / 30 * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Taxa de Refeições</span>
                <span className="text-foreground font-medium">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Meta Mensal de Pontos</span>
                <span className="text-foreground font-medium">
                  {Math.round((totalPoints / 2000) * 100)}%
                </span>
              </div>
              <Progress value={(totalPoints / 2000) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso de Conquistas</span>
                <span className="text-foreground font-medium">
                  {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
                </span>
              </div>
              <Progress value={(unlockedAchievements.length / achievements.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recordes e Marcos */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Recordes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="font-medium text-foreground">Maior Sequência</p>
                    <p className="text-sm text-muted-foreground">Sequência de treinos</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-orange-500/20 text-orange-400">
                  {workoutStreak?.longest_streak || 0} dias
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-foreground">Treino Mais Longo</p>
                    <p className="text-sm text-muted-foreground">Duração máxima</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-blue-500/20 text-blue-400">
                  {Math.round((avgWorkoutDuration * 1.5))}min
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Utensils className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="font-medium text-foreground">Melhor Mês</p>
                    <p className="text-sm text-muted-foreground">Refeições completas</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-green-500/20 text-green-400">
                  {Math.max(...monthlyData.map(d => d.meals))} refeições
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="font-medium text-foreground">Recorde de Pontos</p>
                    <p className="text-sm text-muted-foreground">Em um só mês</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-purple-500/20 text-purple-400">
                  {Math.max(...monthlyData.map(d => d.points))} pts
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights e recomendações */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-2">Insights da Semana</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Sua consistência de treinos aumentou 15% comparado ao mês passado
                </p>
                <p>
                  • Você está próximo de bater seu recorde de sequência de {workoutStreak?.longest_streak || 0} dias
                </p>
                <p>
                  • Taxa de refeições completas está {completionRate > 75 ? 'excelente' : 'melhorando'} - continue assim!
                </p>
                <p>
                  • Você subiu 3 posições no ranking global este mês
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
