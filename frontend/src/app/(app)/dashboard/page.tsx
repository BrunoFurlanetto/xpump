"use client";

import { useState, useEffect } from 'react';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useMeals } from '@/hooks/useMeals';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Flame, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Zap,
  Dumbbell,
  Utensils,
  Users,
  Bell,
  ChevronRight,
  Star,
  Award,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { WorkoutCheckinModal } from "@/components/workouts/workout-checkin-modal";
import { MealLogModal } from "@/components/meals/meal-log-modal";

interface DashboardStats {
  totalPoints: number;
  weeklyPoints: number;
  currentStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  rank: number;
  totalUsers: number;
}

interface WeeklyActivity {
  day: string;
  workouts: number;
  meals: number;
  points: number;
}

interface QuickAction {
  title: string;
  description: string;
  action: () => void;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface NavigationAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function DashboardPage() {
  const { stats: workoutStats, streak: workoutStreak, createWorkout } = useWorkouts();
  const { stats: mealStats, createMeal, mealTypes } = useMeals();
  const { unreadCount, achievements } = useNotifications();
  
  // Estados para controlar os modais
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPoints: 0,
    weeklyPoints: 0,
    currentStreak: 0,
    weeklyGoal: 500,
    weeklyProgress: 0,
    rank: 0,
    totalUsers: 1247
  });

  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);

  // Ações rápidas do dashboard
  const quickActions: QuickAction[] = [
    {
      title: "Registrar Treino",
      description: "Faça check-in do seu treino",
      action: () => setIsWorkoutModalOpen(true),
      icon: Dumbbell,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Adicionar Refeição", 
      description: "Registre sua alimentação",
      action: () => setIsMealModalOpen(true),
      icon: Utensils,
      color: "text-green-400",
      bgColor: "bg-green-500/10 border-green-500/20"
    },
  ];

  const smallQuickActions: NavigationAction[] = [
    {
      title: "Ver Grupos",
      description: "Conecte-se com amigos",
      href: "/groups", 
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Conquistas",
      description: "Veja seu progresso",
      href: "/achievements",
      icon: Trophy,
      color: "text-yellow-400", 
      bgColor: "bg-yellow-500/10 border-yellow-500/20"
    }
  ];

  useEffect(() => {
    // Calcular estatísticas combinadas
    const totalWorkoutPoints = workoutStats?.total_points || 0;
    const totalMealPoints = mealStats?.total_points || 0;
    const weeklyWorkoutPoints = (workoutStats?.this_week_workouts || 0) * 50;
    const weeklyMealPoints = (mealStats?.this_week_meals || 0) * 25;
    
    const newStats: DashboardStats = {
      totalPoints: totalWorkoutPoints + totalMealPoints,
      weeklyPoints: weeklyWorkoutPoints + weeklyMealPoints,
      currentStreak: Math.max(workoutStreak?.current_streak || 0, mealStats?.streak_days || 0),
      weeklyGoal: 500,
      weeklyProgress: 0,
      rank: Math.floor(Math.random() * 50) + 1, // Mock ranking
      totalUsers: 1247
    };
    
    newStats.weeklyProgress = Math.min((newStats.weeklyPoints / newStats.weeklyGoal) * 100, 100);
    
    setDashboardStats(newStats);

    // Gerar atividade semanal mock
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const mockActivity: WeeklyActivity[] = days.map(day => ({
      day,
      workouts: Math.floor(Math.random() * 2),
      meals: Math.floor(Math.random() * 4) + 1,
      points: Math.floor(Math.random() * 100) + 20
    }));
    
    setWeeklyActivity(mockActivity);
  }, [workoutStats, mealStats, workoutStreak]);

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const recentAchievements = unlockedAchievements.slice(0, 3);

  // Funções para lidar com os modais
  const handleWorkoutSubmit = async (data: any) => {
    try {
      await createWorkout(data);
      setIsWorkoutModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar treino:', error);
    }
  };

  const handleMealSubmit = async (data: any) => {
    try {
      await createMeal(data);
      setIsMealModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar refeição:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Aqui está seu resumo de hoje
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/20 text-green-400">
            <Zap className="h-3 w-3 mr-1" />
            {dashboardStats.totalPoints} pontos
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="destructive">
              <Bell className="h-3 w-3 mr-1" />
              {unreadCount} novas
            </Badge>
          )}
        </div>
      </div>

       {/* Ações rápidas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1  gap-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Card 
                  key={index}
                  className={`${action.bgColor} border hover:border-primary/40 transition-colors cursor-pointer`}
                  onClick={action.action}
                >
                  <CardContent className="p-4 text-center">
                    <IconComponent className={`h-8 w-8 mx-auto mb-2 ${action.color}`} />
                    <h3 className="font-medium text-foreground text-sm mb-1">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="grid grid-cols-2  gap-3 pt-3">
            {smallQuickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className={`${action.bgColor} border hover:border-primary/40 transition-colors cursor-pointer`}>
                    <CardContent className="p-4 text-center">
                      <IconComponent className={`h-8 w-8 mx-auto mb-2 ${action.color}`} />
                      <h3 className="font-medium text-foreground text-sm mb-1">{action.title}</h3>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cards principais de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pontos Totais</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">{dashboardStats.totalPoints}</p>
              </div>
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sequência</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-400">{dashboardStats.currentStreak}</p>
              </div>
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ranking</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">#{dashboardStats.rank}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Conquistas</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">{unlockedAchievements.length}</p>
              </div>
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta semanal */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Meta Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{dashboardStats.weeklyPoints} / {dashboardStats.weeklyGoal} pontos</p>
                <p className="text-sm text-muted-foreground">
                  {dashboardStats.weeklyGoal - dashboardStats.weeklyPoints} pontos restantes
                </p>
              </div>
              <Badge 
                variant={dashboardStats.weeklyProgress >= 100 ? "default" : "secondary"}
                className={dashboardStats.weeklyProgress >= 100 ? "bg-green-500 text-white" : ""}
              >
                {Math.round(dashboardStats.weeklyProgress)}%
              </Badge>
            </div>
            <Progress value={dashboardStats.weeklyProgress} className="h-3" />
            
            {dashboardStats.weeklyProgress >= 100 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400 font-medium">
                  🎉 Parabéns! Você alcançou sua meta semanal!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

     

     <details>
     <Button variant="ghost" size="sm" asChild> 
           <summary className="text-white mx-2 my-4"> 
                Ver mais <ChevronDown className="h-4 w-4 ml-1" />
            </summary>
            </Button>
       <div className="grid gap-6 lg:grid-cols-2">
        {/* Atividade semanal */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Atividade da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyActivity.map((day) => (
                <div key={day.day} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center">
                      <span className="text-sm font-medium text-foreground">{day.day}</span>
                    </div>
                    <div className="flex gap-2">
                      {day.workouts > 0 && (
                        <Badge variant="outline" className="text-xs border-blue-500/20 text-blue-400">
                          <Dumbbell className="h-3 w-3 mr-1" />
                          {day.workouts}
                        </Badge>
                      )}
                      {day.meals > 0 && (
                        <Badge variant="outline" className="text-xs border-green-500/20 text-green-400">
                          <Utensils className="h-3 w-3 mr-1" />
                          {day.meals}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-yellow-400">+{day.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conquistas recentes */}
        <Card className="bg-card border-border mb-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Conquistas Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/achievements">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAchievements.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma conquista ainda</p>
                <p className="text-sm text-muted-foreground">Continue treinando para desbloquear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{achievement.description}</p>
                    </div>
                    <Badge variant="outline" className="border-yellow-500/20 text-yellow-400">
                      +{achievement.rewards.points}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
     </details>

      {/* Modais */}
      <WorkoutCheckinModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        onSubmit={handleWorkoutSubmit}
      />
      
      <MealLogModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onSubmit={handleMealSubmit}
        mealTypes={mealTypes}
      />
    
    </div>
  );
}
