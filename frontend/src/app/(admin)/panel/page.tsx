"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Dumbbell, Utensils, TrendingUp, Clock, Award } from "lucide-react";
import { AdminAPI, AdminDashboardData } from "@/lib/api/admin";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dados mockados para desenvolvimento do layout
const MOCK_DASHBOARD_DATA: AdminDashboardData = {
  stats: {
    group_id: 1,
    group_name: "Grupo X-Pump",
    total_members: 24,
    active_members_today: 18,
    total_workouts: 156,
    total_meals: 432,
    pending_validations: 8,
    avg_completion_rate: 78.5,
  },
  recent_workouts: [
    {
      id: 1,
      user_id: 5,
      username: "João Silva",
      location: "Academia Smart Fit",
      comments: "Treino de peito e tríceps completado!",
      workout_date: new Date().toISOString(),
      duration: "1h 15min",
      base_points: 100,
      multiplier: 1.0,
      validation_status: 0,
      validation_status_name: "Pendente",
      proofs: [{ id: 1, file: "/media/workout/proof1.jpg" }],
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 8,
      username: "Maria Santos",
      location: "Casa",
      comments: "Treino funcional em casa",
      workout_date: new Date(Date.now() - 3600000).toISOString(),
      duration: "45min",
      base_points: 80,
      multiplier: 1.0,
      validation_status: 1,
      validation_status_name: "Aprovado",
      proofs: [{ id: 2, file: "/media/workout/proof2.jpg" }],
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      user_id: 12,
      username: "Carlos Oliveira",
      location: "Parque",
      comments: "Corrida matinal",
      workout_date: new Date(Date.now() - 7200000).toISOString(),
      duration: "30min",
      base_points: 60,
      multiplier: 1.0,
      validation_status: 1,
      validation_status_name: "Aprovado",
      proofs: [],
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 4,
      user_id: 3,
      username: "Ana Costa",
      location: "Academia Bodytech",
      comments: "Treino de pernas intenso!",
      workout_date: new Date(Date.now() - 10800000).toISOString(),
      duration: "1h 30min",
      base_points: 120,
      multiplier: 1.0,
      validation_status: 0,
      validation_status_name: "Pendente",
      proofs: [{ id: 3, file: "/media/workout/proof3.jpg" }],
      created_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 5,
      user_id: 15,
      username: "Pedro Alves",
      location: "Crossfit Box",
      comments: "WOD do dia concluído",
      workout_date: new Date(Date.now() - 14400000).toISOString(),
      duration: "1h",
      base_points: 100,
      multiplier: 1.0,
      validation_status: 1,
      validation_status_name: "Aprovado",
      proofs: [{ id: 4, file: "/media/workout/proof4.jpg" }],
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ],
  recent_meals: [
    {
      id: 1,
      user_id: 5,
      username: "João Silva",
      meal_type_id: 1,
      meal_type_name: "Café da Manhã",
      meal_time: new Date().toISOString(),
      comments: "Ovos mexidos com aveia e frutas",
      base_points: 50,
      multiplier: 1.0,
      validation_status: 0,
      validation_status_name: "Pendente",
      proofs: [{ id: 5, file: "/media/meal/meal1.jpg" }],
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 8,
      username: "Maria Santos",
      meal_type_id: 2,
      meal_type_name: "Almoço",
      meal_time: new Date(Date.now() - 1800000).toISOString(),
      comments: "Frango grelhado com batata doce e salada",
      base_points: 80,
      multiplier: 1.0,
      validation_status: 1,
      validation_status_name: "Aprovado",
      proofs: [{ id: 6, file: "/media/meal/meal2.jpg" }],
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 3,
      user_id: 12,
      username: "Carlos Oliveira",
      meal_type_id: 4,
      meal_type_name: "Lanche",
      meal_time: new Date(Date.now() - 5400000).toISOString(),
      comments: "Whey protein com banana",
      base_points: 40,
      multiplier: 1.0,
      validation_status: 1,
      validation_status_name: "Aprovado",
      proofs: [],
      created_at: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: 4,
      user_id: 3,
      username: "Ana Costa",
      meal_type_id: 2,
      meal_type_name: "Almoço",
      meal_time: new Date(Date.now() - 7200000).toISOString(),
      comments: "Salmão assado com quinoa e brócolis",
      base_points: 90,
      multiplier: 1.0,
      validation_status: 0,
      validation_status_name: "Pendente",
      proofs: [{ id: 7, file: "/media/meal/meal3.jpg" }],
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 5,
      user_id: 15,
      username: "Pedro Alves",
      meal_type_id: 1,
      meal_type_name: "Café da Manhã",
      meal_time: new Date(Date.now() - 21600000).toISOString(),
      comments: "Tapioca com queijo e ovo",
      base_points: 60,
      multiplier: 1.0,
      validation_status: 1,
      validation_status_name: "Aprovado",
      proofs: [{ id: 8, file: "/media/meal/meal4.jpg" }],
      created_at: new Date(Date.now() - 21600000).toISOString(),
    },
  ],
  top_members: [
    {
      user_id: 8,
      username: "Maria Santos",
      email: "maria.santos@example.com",
      total_workouts: 22,
      total_meals: 65,
      total_points: 4580,
      current_streak: 15,
      last_activity: new Date(Date.now() - 1800000).toISOString(),
      is_active_today: true,
    },
    {
      user_id: 15,
      username: "Pedro Alves",
      email: "pedro.alves@example.com",
      total_workouts: 20,
      total_meals: 58,
      total_points: 4120,
      current_streak: 12,
      last_activity: new Date(Date.now() - 14400000).toISOString(),
      is_active_today: true,
    },
    {
      user_id: 5,
      username: "João Silva",
      email: "joao.silva@example.com",
      total_workouts: 18,
      total_meals: 54,
      total_points: 3840,
      current_streak: 8,
      last_activity: new Date().toISOString(),
      is_active_today: true,
    },
    {
      user_id: 3,
      username: "Ana Costa",
      email: "ana.costa@example.com",
      total_workouts: 19,
      total_meals: 48,
      total_points: 3560,
      current_streak: 10,
      last_activity: new Date(Date.now() - 10800000).toISOString(),
      is_active_today: true,
    },
    {
      user_id: 12,
      username: "Carlos Oliveira",
      email: "carlos.oliveira@example.com",
      total_workouts: 16,
      total_meals: 52,
      total_points: 3280,
      current_streak: 7,
      last_activity: new Date(Date.now() - 7200000).toISOString(),
      is_active_today: true,
    },
  ],
};

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
      // TODO: Descomentar quando o endpoint estiver pronto
      // const dashboardData = await AdminAPI.getDashboard(selectedGroupId);
      // setData(dashboardData);

      // Usando dados mockados temporariamente
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simula delay de rede
      setData(MOCK_DASHBOARD_DATA);
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das atividades de {data.stats.group_name}</p>
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
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-600">
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
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum treino registrado</p>
              ) : (
                data.recent_workouts.slice(0, 5).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{workout.username.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma refeição registrada</p>
              ) : (
                data.recent_meals.slice(0, 5).map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{meal.username.substring(0, 2).toUpperCase()}</AvatarFallback>
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
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
            ) : (
              data.top_members.map((member, index) => (
                <div key={member.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                      <p className="text-xs text-muted-foreground">🔥 {member.current_streak} dias</p>
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
