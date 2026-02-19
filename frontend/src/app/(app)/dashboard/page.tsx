"use client";

import { useState } from "react";
import { useCreateWorkout } from "@/hooks/useWorkoutsQuery";
import { CreateWorkoutData } from "@/lib/api/workouts";
import { CreateMealData } from "@/lib/api/nutrition";
import { useMealsQuery, useCreateMeal } from "@/hooks/useMealsQuery";
import { useUserAuth } from "@/context/userAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Dumbbell, Utensils, Users, User } from "lucide-react";
import Link from "next/link";
import { WorkoutCheckinModal } from "@/components/workouts/workout-checkin-modal";
import { MealLogModal } from "@/components/meals/meal-log-modal";
import ProfileStatistics from "../profile/_components/profile-statistics";
import CardProgressLevel from "../profile/_components/card-progress-level";
import { useProfileQuery } from "@/hooks/useProfilesQuery";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboardView from "@/app/(app)/dashboard/admin-dashboard-view";

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
  const { user, isAdmin } = useUserAuth();
  const userId = user?.id ? parseInt(user.id) : null;

  // Se for admin, mostra o dashboard administrativo
  if (isAdmin) {
    return <AdminDashboardView />;
  }

  // Dashboard normal do cliente
  const createWorkoutMutation = useCreateWorkout(userId!);
  const createMealMutation = useCreateMeal();
  const { mealTypes } = useMealsQuery(userId!);

  // Estados para controlar os modais
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  const { data: profile, isLoading } = useProfileQuery(user?.profile_id || null);

  // Ações rápidas do dashboard
  const quickActions: QuickAction[] = [
    {
      title: "Registrar Treino",
      description: "Faça check-in do seu treino",
      action: () => setIsWorkoutModalOpen(true),
      icon: Dumbbell,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Adicionar Refeição",
      description: "Registre sua alimentação",
      action: () => setIsMealModalOpen(true),
      icon: Utensils,
      color: "text-green-400",
      bgColor: "bg-green-500/10 border-green-500/20",
    },
  ];

  const smallQuickActions: NavigationAction[] = [
    {
      title: "Perfil",
      description: "Veja seu desempenho",
      href: "/profile",
      icon: User,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      title: "Grupos",
      description: "Conecte-se com amigos",
      href: "/groups",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
    },
    // {
    //   title: "Conquistas",
    //   description: "Veja seu progresso",
    //   href: "/achievements",
    //   icon: Trophy,
    //   color: "text-yellow-400",
    //   bgColor: "bg-yellow-500/10 border-yellow-500/20",
    // },
  ];

  // Funções para lidar com os modais
  const handleWorkoutSubmit = async (data: CreateWorkoutData) => {
    await createWorkoutMutation.mutateAsync(data);
    setIsWorkoutModalOpen(false);
  };

  const handleMealSubmit = async (data: CreateMealData) => {
    await createMealMutation.mutateAsync(data);
    setIsMealModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Bem-vindo de volta! 👋</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Aqui está seu resumo de hoje</p>
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

      {isLoading || !profile ? (
        <>
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progresso de Nível */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Estatísticas Principais */}
          <ProfileStatistics
            score={profile.score}
            current_workout_streak={profile.workout_streak.current_streak}
            current_meal_streak={profile.meal_streak.current_streak}
          />

          {/* Progresso de Level */}
          <CardProgressLevel
            level={profile.level}
            points_to_next_level={profile.points_to_next_level}
            score={profile.score}
          />
        </>
      )}

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
