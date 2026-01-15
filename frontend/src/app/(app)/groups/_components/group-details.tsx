"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Users, ArrowLeft, UserCog, Loader2, Calendar, Users2, Search, Star } from "lucide-react";
import { GroupMembersManager } from "./group-members-manager";
import { Group, GroupsAPI } from "@/lib/api/groups";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import GroupCardHeader from "./group-card-header";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateGroupModal } from "./create-group-modal";

interface GroupDetailsProps {
  group: Group;
  period?: "week" | "month" | "all";
  onPeriodChange?: (period: "week" | "month" | "all") => void;
}

export function GroupDetails({ group: initialGroup, period: externalPeriod, onPeriodChange }: GroupDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ranking");
  const { user, hasRole } = useAuth();
  const [group, setGroup] = useState(initialGroup);
  const [period, setPeriod] = useState<"week" | "month" | "all">(externalPeriod || "week");
  const [isLoading, setIsLoading] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState("");

  // Sincronizar período externo se fornecido
  useEffect(() => {
    if (externalPeriod && externalPeriod !== period) {
      setPeriod(externalPeriod);
    }
  }, [externalPeriod]);

  // Atualizar grupo quando período externo mudar
  useEffect(() => {
    if (externalPeriod) {
      setGroup(initialGroup);
    }
  }, [initialGroup, externalPeriod]);

  // Fetch group data for specific period
  const fetchGroupData = useCallback(
    async (selectedPeriod: "week" | "month" | "all") => {
      setIsLoading(true);
      try {
        console.log("🔄 Fetching group data for period:", selectedPeriod);
        const updatedGroup = await GroupsAPI.getGroup(initialGroup.id, selectedPeriod);
        console.log("✅ Group data updated:", updatedGroup);
        setGroup(updatedGroup);
        onPeriodChange?.(selectedPeriod);
      } catch (error) {
        console.error("Error fetching group:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [initialGroup.id]
  );

  // Fetch group data when period changes
  useEffect(() => {
    fetchGroupData(period);
  }, [period, fetchGroupData]);

  const currentUserMember = group.members.find((m) => m.id === Number(user?.id));
  const currentUserRole = group.owner === Number(user?.id) ? "owner" : currentUserMember?.is_admin ? "admin" : "member";

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin" || hasRole("Admin");

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

  const canSeeGroupsTab = group.main && hasRole("Admin");

  let tabs = 1;
  if (canManageMembers) tabs += 1;
  if (canSeeGroupsTab) tabs += 1;

  // Filtrar grupos com base na busca
  const filteredGroups = (group.other_groups || []).filter(
    (otherGroup) =>
      otherGroup.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
      otherGroup.owner.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <div className="flex items-start">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Group Header */}
      <GroupCardHeader
        name={group.name}
        description={group.description}
        photo={group.photo}
        stats={group.stats}
        currentUserRole={currentUserRole}
        groupId={group.id}
      />

      {/* Conteúdo Principal com Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {tabs > 1 && (
          <TabsList className={cn("grid w-full grid-cols-3", tabs === 2 && "grid-cols-2", tabs === 1 && "grid-cols-1")}>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Ranking
            </TabsTrigger>
            {canManageMembers && (
              <TabsTrigger value="members" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Membros
              </TabsTrigger>
            )}

            {canSeeGroupsTab && (
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users2 className="h-4 w-4" />
                Grupos
              </TabsTrigger>
            )}
          </TabsList>
        )}

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
                  <div className="space-y-4 max-h-[calc(100vh-15rem)] overflow-y-auto">
                    {rankedMembers.length > 0 ? (
                      rankedMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-colors cursor-pointer hover:opacity-80 ${
                            index < 3 ? "bg-primary/10 border border-primary/20" : "bg-muted/30 border border-border"
                          }`}
                          onClick={() => router.push(`/profile/${member.profile_id}`)}
                        >
                          <div className="flex items-center gap-3">
                            {getPositionIcon(member.position || 0)}
                            <Avatar className="h-10 w-10">
                              {member.photo && <AvatarImage src={member.photo} alt={member.full_name} />}
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground truncate">{member.full_name}</h4>
                              {member.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>💪 {member.workouts || 0} treinos</span>
                              <span>🥗 {member.meals || 0} refeições</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">{member.score?.toFixed(2) || 0}</p>
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
                      <div className="grid grid-cols-3 items-end justify-items-center justify-center  gap-1">
                        {/* 2º Lugar */}
                        {topThree[1] && (
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-24 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                              <span className="text-white font-bold text-lg">2º</span>
                            </div>
                            <Avatar className="h-12 w-12 mx-auto mb-2">
                              {topThree[1].photo && <AvatarImage src={topThree[1].photo} alt={topThree[1].full_name} />}
                              <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600">
                                {getInitials(topThree[1].full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium text-nowrap overflow-hidden max-w-[90px]">
                              {topThree[1].full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{topThree[1].score?.toFixed(2) || 0} pts</p>
                          </div>
                        )}

                        {/* 1º Lugar */}
                        {topThree[0] && (
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-28 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                              <span className="text-white font-bold text-lg">1º</span>
                            </div>
                            <Avatar className="h-14 w-14 mx-auto mb-2 ring-2 ring-yellow-400">
                              {topThree[0].photo && <AvatarImage src={topThree[0].photo} alt={topThree[0].full_name} />}
                              <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-yellow-600">
                                {getInitials(topThree[0].full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium text-nowrap overflow-hidden max-w-[90px]">
                              {topThree[0].full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{topThree[0].score?.toFixed(2) || 0} pts</p>
                          </div>
                        )}

                        {/* 3º Lugar */}
                        {topThree[2] && (
                          <div className="text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-20 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                              <span className="text-white font-bold text-lg">3º</span>
                            </div>
                            <Avatar className="h-12 w-12 mx-auto mb-2">
                              {topThree[2].photo && <AvatarImage src={topThree[2].photo} alt={topThree[2].full_name} />}
                              <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-800">
                                {getInitials(topThree[2].full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium text-nowrap overflow-hidden max-w-[90px]">
                              {topThree[2].full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{topThree[2].score?.toFixed(2) || 0} pts</p>
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
                      <span
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => router.push(`/profile/${group.owner_profile_id}`)}
                      >
                        {group.created_by}
                      </span>
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
              groupName={group.name}
              members={group.members}
              currentUserId={Number(user?.id)}
              currentUserRole={currentUserRole}
              clientCode={group.client_code}
              onMemberUpdate={async () => {
                await fetchGroupData(period);
              }}
            />
          </TabsContent>
        )}

        {/* Aba de Grupos da Empresa */}
        {canSeeGroupsTab && (
          <TabsContent value="groups">
            <div className="w-full flex justify-end mb-4">
              <div className="max-w-60">
                <CreateGroupModal
                  onGroupCreated={async () => {
                    await fetchGroupData(period);
                  }}
                  groupId={group.id}
                />
              </div>
            </div>
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="h-5 w-5" />
                    Grupos da Empresa
                    <Badge variant="secondary">{group.other_groups?.length || 0}</Badge>
                  </CardTitle>
                </div>

                {/* Barra de Busca */}
                <div className="relative pt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar grupos..."
                    value={groupSearchTerm}
                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((otherGroup) => (
                      <div
                        key={otherGroup.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border transition-colors cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/groups/${otherGroup.id}`)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                            {getInitials(otherGroup.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{otherGroup.name}</h4>
                          <p className="text-sm text-muted-foreground">Criado por: {otherGroup.owner}</p>
                          <div className="flex mt-1 flex-wrap items-center justify-center sm:justify-start gap-3">
                            {/* Total Members */}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <Users className="h-3 w-3 text-emerald-500" />
                              <span className="text-xs font-medium text-emerald-400">
                                {otherGroup.n_members || 0} membro{otherGroup.n_members !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {/* Total Points */}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-400">
                                {otherGroup.pts?.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        {groupSearchTerm ? "Nenhum grupo encontrado com esse termo" : "Nenhum outro grupo na empresa"}
                      </p>
                      {groupSearchTerm && <p className="text-sm mt-2">Tente ajustar os termos de busca</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
