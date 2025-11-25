"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAPI, AdminMemberActivity } from "@/lib/api/admin";
import { Trophy, Activity, TrendingUp, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";

// Dados mockados para desenvolvimento do layout
const MOCK_MEMBERS: AdminMemberActivity[] = [
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
  {
    user_id: 7,
    username: "Juliana Ferreira",
    email: "juliana.ferreira@example.com",
    total_workouts: 15,
    total_meals: 45,
    total_points: 2950,
    current_streak: 5,
    last_activity: new Date(Date.now() - 18000000).toISOString(),
    is_active_today: true,
  },
  {
    user_id: 11,
    username: "Rafael Mendes",
    email: "rafael.mendes@example.com",
    total_workouts: 14,
    total_meals: 42,
    total_points: 2780,
    current_streak: 6,
    last_activity: new Date(Date.now() - 86400000).toISOString(),
    is_active_today: false,
  },
  {
    user_id: 20,
    username: "Fernanda Lima",
    email: "fernanda.lima@example.com",
    total_workouts: 13,
    total_meals: 39,
    total_points: 2560,
    current_streak: 4,
    last_activity: new Date(Date.now() - 172800000).toISOString(),
    is_active_today: false,
  },
  {
    user_id: 18,
    username: "Bruno Castro",
    email: "bruno.castro@example.com",
    total_workouts: 12,
    total_meals: 38,
    total_points: 2420,
    current_streak: 3,
    last_activity: new Date(Date.now() - 259200000).toISOString(),
    is_active_today: false,
  },
  {
    user_id: 9,
    username: "Camila Rodrigues",
    email: "camila.rodrigues@example.com",
    total_workouts: 11,
    total_meals: 36,
    total_points: 2280,
    current_streak: 9,
    last_activity: new Date(Date.now() - 3600000).toISOString(),
    is_active_today: true,
  },
  {
    user_id: 22,
    username: "Lucas Martins",
    email: "lucas.martins@example.com",
    total_workouts: 10,
    total_meals: 33,
    total_points: 2140,
    current_streak: 2,
    last_activity: new Date(Date.now() - 432000000).toISOString(),
    is_active_today: false,
  },
  {
    user_id: 14,
    username: "Beatriz Souza",
    email: "beatriz.souza@example.com",
    total_workouts: 9,
    total_meals: 30,
    total_points: 1980,
    current_streak: 11,
    last_activity: new Date(Date.now() - 5400000).toISOString(),
    is_active_today: true,
  },
  {
    user_id: 16,
    username: "Gustavo Rocha",
    email: "gustavo.rocha@example.com",
    total_workouts: 8,
    total_meals: 28,
    total_points: 1820,
    current_streak: 0,
    last_activity: new Date(Date.now() - 604800000).toISOString(),
    is_active_today: false,
  },
  {
    user_id: 25,
    username: "Larissa Pinto",
    email: "larissa.pinto@example.com",
    total_workouts: 7,
    total_meals: 25,
    total_points: 1650,
    current_streak: 1,
    last_activity: new Date(Date.now() - 518400000).toISOString(),
    is_active_today: false,
  },
  {
    user_id: 19,
    username: "Diego Cardoso",
    email: "diego.cardoso@example.com",
    total_workouts: 6,
    total_meals: 22,
    total_points: 1480,
    current_streak: 13,
    last_activity: new Date(Date.now() - 21600000).toISOString(),
    is_active_today: true,
  },
  {
    user_id: 23,
    username: "Amanda Freitas",
    email: "amanda.freitas@example.com",
    total_workouts: 5,
    total_meals: 18,
    total_points: 1250,
    current_streak: 0,
    last_activity: new Date(Date.now() - 691200000).toISOString(),
    is_active_today: false,
  },
  {
    user_id: 10,
    username: "Thiago Barros",
    email: "thiago.barros@example.com",
    total_workouts: 4,
    total_meals: 15,
    total_points: 1080,
    current_streak: 14,
    last_activity: new Date(Date.now() - 7200000).toISOString(),
    is_active_today: true,
  },
  {
    user_id: 21,
    username: "Patricia Nunes",
    email: "patricia.nunes@example.com",
    total_workouts: 3,
    total_meals: 12,
    total_points: 890,
    current_streak: 0,
    last_activity: new Date(Date.now() - 777600000).toISOString(),
    is_active_today: false,
  },
];

export default function MembersPage() {
  const [members, setMembers] = useState<AdminMemberActivity[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<AdminMemberActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const checkSelectedGroup = () => {
      const savedGroupId = localStorage.getItem("adminSelectedGroupId");
      if (savedGroupId) {
        setSelectedGroupId(parseInt(savedGroupId));
      }
    };

    checkSelectedGroup();
    const interval = setInterval(checkSelectedGroup, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadMembers();
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredMembers(
        members.filter(
          (m) =>
            m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const loadMembers = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      // TODO: Descomentar quando o endpoint estiver pronto
      // const data = await AdminAPI.getGroupMembers(selectedGroupId);
      // setMembers(data);
      // setFilteredMembers(data);

      // Usando dados mockados temporariamente
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simula delay de rede
      setMembers(MOCK_MEMBERS);
      setFilteredMembers(MOCK_MEMBERS);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedGroupId) {
    return null;
  }

  if (loading) {
    return <MembersSkeleton />;
  }

  const activeMembers = members.filter((m) => m.is_active_today).length;
  const totalPoints = members.reduce((sum, m) => sum + m.total_points, 0);
  const avgStreak = members.length > 0 ? members.reduce((sum, m) => sum + m.current_streak, 0) / members.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Membros da Equipe</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho de cada membro</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total de Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">{activeMembers} ativos hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Total de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Acumulado do grupo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Sequência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgStreak.toFixed(1)} dias</div>
            <p className="text-xs text-muted-foreground">Média de streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.length > 0 ? ((activeMembers / members.length) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar membro por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Membros</CardTitle>
          <CardDescription>{filteredMembers.length} membro(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum membro encontrado</p>
            ) : (
              filteredMembers.map((member, index) => (
                <div key={member.user_id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                      {index + 1}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.username}</p>
                        {member.is_active_today && (
                          <Badge variant="default" className="text-xs">
                            Ativo hoje
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>🏋️ {member.total_workouts} treinos</span>
                        <span>🍽️ {member.total_meals} refeições</span>
                        {member.current_streak > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {member.current_streak} dias
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{member.total_points.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                    {member.last_activity && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Último: {new Date(member.last_activity).toLocaleDateString("pt-BR")}
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

function MembersSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-full max-w-sm" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b pb-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-48" />
                  <Skeleton className="mt-1 h-3 w-64" />
                </div>
                <div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="mt-2 h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
