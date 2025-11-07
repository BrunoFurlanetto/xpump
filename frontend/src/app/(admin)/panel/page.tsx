"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Dumbbell, Utensils, TrendingUp, Clock, Award } from "lucide-react";
import { AdminAPI, AdminDashboardData } from "@/lib/api/admin";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  useEffect(() => {
    // Observar mudanças no grupo selecionado
    const checkSelectedGroup = () => {
      const savedGroupId = localStorage.getItem("adminSelectedGroupId");
      if (savedGroupId) {
        setSelectedGroupId(parseInt(savedGroupId));
      }
    };

    checkSelectedGroup();
    
    // Verificar periodicamente por mudanças
    const interval = setInterval(checkSelectedGroup, 500);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadDashboard();
    }
  }, [selectedGroupId]);

  const loadDashboard = async () => {
    if (!selectedGroupId) return;
    
    setLoading(true);
    try {
      const dashboardData = await AdminAPI.getDashboard(selectedGroupId);
      setData(dashboardData);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedGroupId) {
    return null;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total de Membros",
      value: data.stats.total_members,
      icon: Users,
      description: `${data.stats.active_members_today} ativos hoje`,
      color: "text-blue-600",
    },
    {
      title: "Treinos Registrados",
      value: data.stats.total_workouts,
      icon: Dumbbell,
      description: "Total no período",
      color: "text-green-600",
    },
    {
      title: "Refeições Registradas",
      value: data.stats.total_meals,
      icon: Utensils,
      description: "Total no período",
      color: "text-orange-600",
    },
    {
      title: "Taxa de Conclusão",
      value: `${data.stats.avg_completion_rate.toFixed(0)}%`,
      icon: TrendingUp,
      description: "Média do grupo",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das atividades de {data.stats.group_name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Validations Alert */}
      {data.stats.pending_validations > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
              <Clock className="h-5 w-5" />
              Validações Pendentes
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-200">
              Existem {data.stats.pending_validations} atividades aguardando validação
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Treinos Recentes
            </CardTitle>
            <CardDescription>Últimas atividades de treino</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent_workouts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum treino registrado
                </p>
              ) : (
                data.recent_workouts.slice(0, 5).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {workout.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{workout.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {workout.duration} • {new Date(workout.workout_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={workout.validation_status === 1 ? "default" : "secondary"}>
                      {workout.base_points} pts
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Meals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Refeições Recentes
            </CardTitle>
            <CardDescription>Últimos registros de alimentação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent_meals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma refeição registrada
                </p>
              ) : (
                data.recent_meals.slice(0, 5).map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {meal.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{meal.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {meal.meal_type_name} • {new Date(meal.meal_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={meal.validation_status === 1 ? "default" : "secondary"}>
                      {meal.base_points} pts
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Membros
          </CardTitle>
          <CardDescription>Membros mais ativos da semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.top_members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade registrada
              </p>
            ) : (
              data.top_members.map((member, index) => (
                <div key={member.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {member.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.total_workouts} treinos • {member.total_meals} refeições
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{member.total_points} pts</p>
                    {member.current_streak > 0 && (
                      <p className="text-xs text-muted-foreground">
                        🔥 {member.current_streak} dias
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-1 h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
