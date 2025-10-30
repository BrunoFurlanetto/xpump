"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Calendar,
  Users,
  Star,
  Flame,
  Target,
  ArrowLeft,
  UserCog,
} from "lucide-react";
import { GroupMembersManager } from "./group-members-manager";
import { Group } from "@/app/(app)/_actions/groups";
import Link from "next/link";

interface GroupDetailsProps {
  group: Group;
}

// Mock data para ranking e estatísticas
const mockRankingData = [
  {
    id: 1,
    username: "João Silva",
    points: 1250,
    weeklyPoints: 320,
    position: 1,
    streak: 12,
    workouts: 5,
    meals: 21,
    avatar: null,
    trend: "up",
  },
  {
    id: 2,
    username: "Maria Santos",
    points: 1180,
    weeklyPoints: 290,
    position: 2,
    streak: 8,
    workouts: 4,
    meals: 20,
    avatar: null,
    trend: "up",
  },
  {
    id: 3,
    username: "Pedro Costa",
    points: 980,
    weeklyPoints: 250,
    position: 3,
    streak: 5,
    workouts: 3,
    meals: 18,
    avatar: null,
    trend: "down",
  },
];

export function GroupDetails({ group }: GroupDetailsProps) {
  console.log(group);
  const [activeTab, setActiveTab] = useState("ranking");

  // Simular usuário atual (em um app real, viria do contexto de auth)
  const currentUserId = 1;
  const currentUserMember = group.members.find((m) => m.id === currentUserId);
  const currentUserRole =
    group.owner === currentUserId
      ? "owner"
      : currentUserMember?.is_admin
        ? "admin"
        : "member";

  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("week");

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
            {position}
          </div>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
    );
  };

  const periodLabels = {
    week: "Esta Semana",
    month: "Este Mês",
    all: "Geral",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Link
          href="/groups"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "border-border text-foreground hover:bg-muted",
          })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
            {group.name}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {group.description}
          </p>
        </div>
      </div>

      {/* Estatísticas do Grupo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Membros
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {group.members.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Treinos da Semana
                </p>
                <p className="text-2xl font-bold text-foreground">47</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sequência Média
                </p>
                <p className="text-2xl font-bold text-foreground">8.5</p>
              </div>
              <Flame className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pontos Totais
                </p>
                <p className="text-2xl font-bold text-foreground">3,410</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal com Abas */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
          {canManageMembers && (
            <TabsTrigger value="members" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Gerenciar Membros
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          {/* Controles de Período */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle className="text-foreground">
                    Ranking do Grupo
                  </CardTitle>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {(
                    Object.keys(periodLabels) as Array<
                      keyof typeof periodLabels
                    >
                  ).map((period) => (
                    <Button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      variant={
                        selectedPeriod === period ? "default" : "outline"
                      }
                      size="sm"
                      className={
                        selectedPeriod === period
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-muted"
                      }
                    >
                      {periodLabels[period]}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Ranking */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  Classificação - {periodLabels[selectedPeriod]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRankingData.map((member, index) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                        index < 3
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/30 border border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getPositionIcon(member.position)}
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                            {getInitials(member.username)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground truncate">
                            {member.username}
                          </h4>
                          {getTrendIcon(member.trend)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>🔥 {member.streak} dias</span>
                          <span>💪 {member.workouts} treinos</span>
                          <span>🥗 {member.meals} refeições</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {member.points}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          +{member.weeklyPoints} esta semana
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações Detalhadas */}
            <div className="space-y-4">
              {/* Top 3 */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Pódium da Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-center gap-4">
                    {/* 2º Lugar */}
                    <div className="text-center">
                      <div className="w-16 h-20 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                        <span className="text-white font-bold text-lg">2º</span>
                      </div>
                      <Avatar className="h-12 w-12 mx-auto mb-2">
                        <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600">
                          {getInitials(mockRankingData[1].username)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">
                        {mockRankingData[1].username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mockRankingData[1].weeklyPoints} pts
                      </p>
                    </div>

                    {/* 1º Lugar */}
                    <div className="text-center">
                      <div className="w-16 h-24 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                        <span className="text-white font-bold text-lg">1º</span>
                      </div>
                      <Avatar className="h-14 w-14 mx-auto mb-2 ring-2 ring-yellow-400">
                        <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-yellow-600">
                          {getInitials(mockRankingData[0].username)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">
                        {mockRankingData[0].username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mockRankingData[0].weeklyPoints} pts
                      </p>
                    </div>

                    {/* 3º Lugar */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                        <span className="text-white font-bold text-lg">3º</span>
                      </div>
                      <Avatar className="h-10 w-10 mx-auto mb-2">
                        <AvatarFallback className="bg-gradient-to-br from-amber-600 to-amber-700">
                          {getInitials(mockRankingData[2].username)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">
                        {mockRankingData[2].username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mockRankingData[2].weeklyPoints} pts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progresso do Grupo */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Meta Semanal do Grupo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Treinos Realizados</span>
                      <span>47/50</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Refeições Registradas</span>
                      <span>132/140</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sequências Ativas</span>
                      <span>8/12</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Grupo */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Criado em:
                    </span>
                    <span>
                      {new Date(group.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Administradores:
                    </span>
                    <span>
                      {group.members.filter((m) => m.is_admin).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Aba de Gerenciamento de Membros */}
        {canManageMembers && (
          <TabsContent value="members">
            <GroupMembersManager
              groupId={group.id}
              members={group.members}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onMemberUpdate={() => {
                // Em uma aplicação real, isso faria refresh dos dados
                console.log("Member updated, refreshing data...");
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
