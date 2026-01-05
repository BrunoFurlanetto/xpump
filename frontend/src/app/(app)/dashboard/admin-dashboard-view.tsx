"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Dumbbell,
  Utensils,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  MessageSquare,
  Heart,
  FileText,
  Trophy,
  Flame,
  Calendar,
} from "lucide-react";
import { useSystemStats, useAllClients, useAllGroups } from "@/hooks/useAdminQuery";
import Link from "next/link";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card className={`${bgColor} border`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`${color} ${bgColor} p-3 rounded-lg`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardView() {
  const { data: stats, isLoading: isLoadingStats } = useSystemStats();
  const { data: clientsData, isLoading: isLoadingClients } = useAllClients(1, 5, "-last_activity");
  const { data: groupsData, isLoading: isLoadingGroups } = useAllGroups(1, 5);

  // Dados para gráficos
  const activityData = [
    {
      name: "Hoje",
      workouts: stats?.workouts_today || 0,
      meals: stats?.meals_today || 0,
      posts: stats?.posts_today || 0,
    },
    {
      name: "Semana",
      workouts: stats?.workouts_this_week || 0,
      meals: stats?.meals_this_week || 0,
      posts: stats?.posts_this_week || 0,
    },
    {
      name: "Mês",
      workouts: stats?.workouts_this_month || 0,
      meals: stats?.meals_this_month || 0,
      posts: stats?.posts_this_month || 0,
    },
  ];

  const userActivityData = [
    { name: "Hoje", users: stats?.new_users_today || 0 },
    { name: "Semana", users: stats?.new_users_this_week || 0 },
    { name: "Mês", users: stats?.new_users_this_month || 0 },
  ];

  const clientActivityData = [
    { name: "Hoje", clients: stats?.new_clients_today || 0 },
    { name: "Semana", clients: stats?.new_clients_this_week || 0 },
    { name: "Mês", clients: stats?.new_clients_this_month || 0 },
  ];

  if (isLoadingStats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Dashboard Administrativo 📊</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Visão geral do sistema - Personal Trainer</p>
      </div>

      {/* Estatísticas Principais - Usuários e Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuários"
          value={stats?.total_users || 0}
          subtitle={`${stats?.active_users || 0} ativos, ${stats?.inactive_users || 0} inativos`}
          icon={Users}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          title="Total de Clientes"
          value={stats?.total_clients || 0}
          subtitle={`${stats?.active_clients || 0} ativos, ${stats?.inactive_clients || 0} inativos`}
          icon={UserCheck}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
        />
        <StatCard
          title="Total de Grupos"
          value={stats?.total_groups || 0}
          icon={Users}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          title="Temporadas Ativas"
          value={stats?.active_seasons || 0}
          icon={Calendar}
          color="text-indigo-400"
          bgColor="bg-indigo-500/10"
        />
      </div>

      {/* Estatísticas de Atividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Treinos (Total)"
          value={stats?.total_workouts || 0}
          subtitle={`${stats?.workouts_this_week || 0} esta semana`}
          icon={Dumbbell}
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          title="Refeições (Total)"
          value={stats?.total_meals || 0}
          subtitle={`${stats?.meals_this_week || 0} esta semana`}
          icon={Utensils}
          color="text-orange-400"
          bgColor="bg-orange-500/10"
        />
        <StatCard
          title="Posts (Total)"
          value={stats?.total_posts || 0}
          subtitle={`${stats?.posts_this_week || 0} esta semana`}
          icon={FileText}
          color="text-pink-400"
          bgColor="bg-pink-500/10"
        />
        <StatCard
          title="Comentários (Total)"
          value={stats?.total_comments || 0}
          subtitle={`${stats?.comments_this_week || 0} esta semana`}
          icon={MessageSquare}
          color="text-violet-400"
          bgColor="bg-violet-500/10"
        />
      </div>

      {/* Estatísticas de Engajamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total de Curtidas"
          value={stats?.total_likes || 0}
          subtitle={`${stats?.likes_this_week || 0} esta semana`}
          icon={Heart}
          color="text-red-400"
          bgColor="bg-red-500/10"
        />
        <StatCard
          title="Relatórios Pendentes"
          value={stats?.pending_reports || 0}
          icon={Activity}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          title="Nível Médio dos Usuários"
          value={parseFloat((stats?.average_user_level || 0).toFixed(1))}
          subtitle={`Score médio: ${parseFloat((stats?.average_user_score || 0).toFixed(1))}`}
          icon={Trophy}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
        />
      </div>

      {/* Gráficos de Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Atividades */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividades no Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                workouts: {
                  label: "Treinos",
                  color: "hsl(var(--chart-1))",
                },
                meals: {
                  label: "Refeições",
                  color: "hsl(var(--chart-2))",
                },
                posts: {
                  label: "Posts",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={activityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="workouts" fill="hsl(142 76% 36%)" radius={4} />
                <Bar dataKey="meals" fill="hsl(24 95% 53%)" radius={4} />
                <Bar dataKey="posts" fill="hsl(330 81% 60%)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Novos Usuários */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Novos Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                users: {
                  label: "Usuários",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={userActivityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(217 91% 60%)", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Novos Clientes e Médias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Novos Clientes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Novos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                clients: {
                  label: "Clientes",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={clientActivityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="clients"
                  stroke="hsl(189 94% 43%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(189 94% 43%)", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Estatísticas de Streaks */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              Médias de Sequências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-[300px] content-center">
              <div className="text-center p-6 bg-green-500/10 rounded-lg border border-green-500/20">
                <Dumbbell className="h-10 w-10 mx-auto mb-3 text-green-400" />
                <p className="text-4xl font-bold text-foreground mb-2">
                  {parseFloat((stats?.average_workout_streak || 0).toFixed(1))}
                </p>
                <p className="text-sm text-muted-foreground">Sequência Média de Treinos</p>
              </div>
              <div className="text-center p-6 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Utensils className="h-10 w-10 mx-auto mb-3 text-orange-400" />
                <p className="text-4xl font-bold text-foreground mb-2">
                  {parseFloat((stats?.average_meal_streak || 0).toFixed(1))}
                </p>
                <p className="text-sm text-muted-foreground">Sequência Média de Refeições</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas do Mês */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Estatísticas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.new_users_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Novos Usuários</p>
            </div>
            <div className="text-center p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.new_clients_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Novos Clientes</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.workouts_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Treinos do Mês</p>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Utensils className="h-8 w-8 mx-auto mb-2 text-orange-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.meals_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Refeições do Mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas de Engajamento do Mês */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Engajamento Social do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
              <FileText className="h-8 w-8 mx-auto mb-2 text-pink-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.posts_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Posts do Mês</p>
            </div>
            <div className="text-center p-4 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-violet-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.comments_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Comentários do Mês</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <Heart className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.likes_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Curtidas do Mês</p>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Activity className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.pending_reports || 0}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid com Clientes e Grupos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes Recentes */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Clientes Ativos Recentes</CardTitle>
            <Link href="/admin/clients" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingClients ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {clientsData?.results.slice(0, 5).map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {client.first_name} {client.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">@{client.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">Nível {client.profile_level}</p>
                      <p className="text-xs text-muted-foreground">{client.workout_count} treinos</p>
                    </div>
                  </div>
                ))}
                {(!clientsData?.results || clientsData.results.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grupos */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Grupos Ativos</CardTitle>
            <Link href="/admin/groups" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingGroups ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {groupsData?.results.slice(0, 5).map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{group.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{group.member_count} membros</p>
                      <p className="text-xs text-muted-foreground">{group.total_workouts} treinos</p>
                    </div>
                  </div>
                ))}
                {(!groupsData?.results || groupsData.results.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">Nenhum grupo encontrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atividade de Hoje */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Atividade de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.new_users_today || 0}</p>
              <p className="text-sm text-muted-foreground">Novos Usuários</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <Dumbbell className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.workouts_today || 0}</p>
              <p className="text-sm text-muted-foreground">Treinos Hoje</p>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Utensils className="h-6 w-6 mx-auto mb-2 text-orange-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.meals_today || 0}</p>
              <p className="text-sm text-muted-foreground">Refeições Hoje</p>
            </div>
            <div className="text-center p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
              <FileText className="h-6 w-6 mx-auto mb-2 text-pink-400" />
              <p className="text-2xl font-bold text-foreground">{stats?.posts_today || 0}</p>
              <p className="text-sm text-muted-foreground">Posts Hoje</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
