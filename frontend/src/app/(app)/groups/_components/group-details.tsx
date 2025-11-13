"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Crown,
  Users,
  Star,
  Flame,
  Target,
  ArrowLeft,
  UserCog,
  Loader2,
  Calendar,
  Utensils,
} from "lucide-react";
import { GroupMembersManager } from "./group-members-manager";
import { Group } from "@/lib/api/groups";
import Link from "next/link";
import { useGroupsContext } from "@/context/groupsContext";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupDetailsProps {
  group: Group;
}

export function GroupDetails({ group: initialGroup }: GroupDetailsProps) {
  const [activeTab, setActiveTab] = useState("ranking");
  const { user } = useAuth();
  const { fetchGroup, period, setPeriod, isLoading } = useGroupsContext();
  const [group, setGroup] = useState(initialGroup);
  const [isFirstMount, setIsFirstMount] = useState(true);

  // Fetch group data when period changes (skip first mount since we have initialGroup)
  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }

    const loadGroup = async () => {
      const updatedGroup = await fetchGroup(initialGroup.id, period);
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
    };
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const currentUserMember = group.members.find((m) => m.id === Number(user?.id));
  const currentUserRole = group.owner === Number(user?.id) ? "owner" : currentUserMember?.is_admin ? "admin" : "member";

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

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
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const periodLabels = {
    week: "Semana",
    month: "Mês",
    all: "Geral",
  };

  // Ordenar membros por posição
  const rankedMembers = [...group.members]
    .filter((m) => m.position !== undefined && m.position !== null)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const topThree = rankedMembers.slice(0, 3);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{group.name}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{group.description}</p>
        </div>
      </div>

      {/* Estatísticas do Grupo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Membros</p>
                <p className="text-2xl font-bold text-foreground">{group.stats?.total_members || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Treinos</p>
                <p className="text-2xl font-bold text-foreground">{group.stats?.total_workouts || 0}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:px-5 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Refeições Saudáveis</p>
                <p className="text-2xl font-bold text-foreground">{group.stats?.total_meals || 0}</p>
              </div>
              <Utensils className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sequência Média</p>
                <p className="text-2xl font-bold text-foreground">
                  {group.stats?.mean_streak ? group.stats.mean_streak.toFixed(1) : "0"}
                </p>
              </div>
              <Flame className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pontos Totais</p>
                <p className="text-2xl font-bold text-foreground">
                  {group.stats?.total_points?.toLocaleString("pt-BR") || 0}
                </p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal com Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                  <CardTitle className="text-foreground">Ranking do Grupo</CardTitle>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {(["week", "month", "all"] as const).map((p) => (
                    <Button
                      key={p}
                      onClick={() => setPeriod(p)}
                      variant={period === p ? "default" : "outline"}
                      size="sm"
                      disabled={isLoading}
                      className={
                        period === p
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-muted"
                      }
                    >
                      {isLoading && period === p && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      {periodLabels[p]}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista de Ranking */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Classificação - {periodLabels[period]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rankedMembers.length > 0 ? (
                      rankedMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                            index < 3 ? "bg-primary/10 border border-primary/20" : "bg-muted/30 border border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {getPositionIcon(member.position || 0)}
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                                {getInitials(member.username)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground truncate">{member.username}</h4>
                              {member.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>💪 {member.workouts || 0} treinos</span>
                              <span>🥗 {member.meals || 0} refeições</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">{member.score || 0}</p>
                            <p className="text-sm text-muted-foreground">pontos</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum membro com atividades neste período</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informações Detalhadas */}
              <div className="space-y-4">
                {/* Top 3 */}
                {topThree.length >= 3 && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Pódium - {periodLabels[period]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-center gap-4">
                        {/* 2º Lugar */}
                        {topThree[1] && (
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-20 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                              <span className="text-white font-bold text-lg">2º</span>
                            </div>
                            <Avatar className="h-12 w-12 mx-auto mb-2">
                              <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600">
                                {getInitials(topThree[1].username)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium">{topThree[1].username}</p>
                            <p className="text-xs text-muted-foreground">{topThree[1].score || 0} pts</p>
                          </div>
                        )}

                        {/* 1º Lugar */}
                        {topThree[0] && (
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-24 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                              <span className="text-white font-bold text-lg">1º</span>
                            </div>
                            <Avatar className="h-14 w-14 mx-auto mb-2 ring-2 ring-yellow-400">
                              <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-yellow-600">
                                {getInitials(topThree[0].username)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium">{topThree[0].username}</p>
                            <p className="text-xs text-muted-foreground">{topThree[0].score || 0} pts</p>
                          </div>
                        )}

                        {/* 3º Lugar */}
                        {topThree[2] && (
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                              <span className="text-white font-bold text-lg">3º</span>
                            </div>
                            <Avatar className="h-12 w-12 mx-auto mb-2">
                              <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-800">
                                {getInitials(topThree[2].username)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium">{topThree[2].username}</p>
                            <p className="text-xs text-muted-foreground">{topThree[2].score || 0} pts</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                      <span>{new Date(group.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Criado por:
                      </span>
                      <span className="font-medium">{group.created_by}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Aba de Gerenciamento de Membros */}
        {canManageMembers && (
          <TabsContent value="members">
            <GroupMembersManager
              groupId={group.id}
              members={group.members}
              currentUserId={Number(user?.id)}
              currentUserRole={currentUserRole}
              onMemberUpdate={async () => {
                const updated = await fetchGroup(group.id, period);
                if (updated) setGroup(updated);
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
