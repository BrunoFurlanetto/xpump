import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Flame,
  Target,
  Calendar,
  Users,
  Medal,
  TrendingUp,
  Settings,
  Bell,
  Award,
  Utensils,
  Dumbbell,
  User,
} from "lucide-react";

// Mock data - em um app real, isso viria de uma API
const mockUserData = {
  name: "João Silva",
  email: "joao@email.com",
  avatar: null, // Simulando usuário sem foto - altere para "/placeholder-avatar.jpg" para testar com foto
  level: 12,
  totalPoints: 2450,
  pointsToNextLevel: 550,
  currentStreak: 7,
  bestStreak: 21,
  joinDate: "2024-01-15",
  workoutCount: 45,
  mealCount: 132,
  achievements: [
    { id: 1, name: "Primeira Semana", description: "Complete 7 dias consecutivos", icon: "🔥", earned: true },
    { id: 2, name: "Consistência", description: "30 treinos realizados", icon: "💪", earned: true },
    { id: 3, name: "Nutri Expert", description: "50 refeições registradas", icon: "🥗", earned: true },
    { id: 4, name: "Lenda", description: "100 treinos realizados", icon: "👑", earned: false },
  ],
  weeklyStats: {
    workouts: 5,
    meals: 20,
    totalWorkouts: 7,
    totalMeals: 28,
  },
  groups: [
    { id: 1, name: "Galera da Academia", members: 12, rank: 3 },
    { id: 2, name: "Time Nutrição", members: 8, rank: 1 },
  ],
};

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header do Perfil */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-lg border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <Avatar className="h-20 w-20 ring-2 ring-white/20">
          {mockUserData.avatar ? <AvatarImage src={mockUserData.avatar} alt={mockUserData.name} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{mockUserData.name}</h1>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
              Nível {mockUserData.level}
            </Badge>
          </div>
          <p className="text-muted-foreground">{mockUserData.email}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Membro desde {new Date(mockUserData.joinDate).toLocaleDateString("pt-BR")}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              {mockUserData.currentStreak} dias de sequência
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pontos Totais</p>
                <p className="text-2xl font-bold text-blue-400">{mockUserData.totalPoints.toLocaleString()}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sequência Atual</p>
                <p className="text-2xl font-bold text-orange-400">{mockUserData.currentStreak} dias</p>
              </div>
              <Flame className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Treinos</p>
                <p className="text-2xl font-bold text-green-400">{mockUserData.workoutCount}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Refeições</p>
                <p className="text-2xl font-bold text-purple-400">{mockUserData.mealCount}</p>
              </div>
              <Utensils className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do Nível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso do Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Nível {mockUserData.level}</span>
              <span>{mockUserData.pointsToNextLevel} pontos para o próximo nível</span>
            </div>
            <Progress value={(mockUserData.totalPoints % 1000) / 10} max={100} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {mockUserData.totalPoints.toLocaleString()} / {Math.ceil(mockUserData.totalPoints / 1000) * 1000} pontos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas da Semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Esta Semana
          </CardTitle>
          <CardDescription>Seu progresso nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Treinos</span>
                <span className="text-sm text-muted-foreground">
                  {mockUserData.weeklyStats.workouts}/{mockUserData.weeklyStats.totalWorkouts}
                </span>
              </div>
              <Progress
                value={(mockUserData.weeklyStats.workouts / mockUserData.weeklyStats.totalWorkouts) * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Refeições</span>
                <span className="text-sm text-muted-foreground">
                  {mockUserData.weeklyStats.meals}/{mockUserData.weeklyStats.totalMeals}
                </span>
              </div>
              <Progress
                value={(mockUserData.weeklyStats.meals / mockUserData.weeklyStats.totalMeals) * 100}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conquistas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Conquistas
          </CardTitle>
          <CardDescription>Seus marcos e realizações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockUserData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border ${
                  achievement.earned ? "bg-green-500/10 border-green-500/30" : "bg-muted/10 border-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${achievement.earned ? "text-green-400" : "text-muted-foreground"}`}>
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <Badge variant="success" className="text-xs">
                      Conquistado
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grupos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Meus Grupos
          </CardTitle>
          <CardDescription>Grupos que você participa e seu ranking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUserData.groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{group.name}</h4>
                    <p className="text-sm text-muted-foreground">{group.members} membros</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-yellow-400" />
                  <span className="font-semibold">#{group.rank}</span>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Entrar em Novo Grupo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
