import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Utensils,
  Dumbbell,
} from "lucide-react";
import { getCurrentUser } from "../_actions/getCurrentUser";
import { getProfileById } from "../_actions/getProfileById";
import GroupListCard from "./group-list-card";
import ProfileCardHeader from "./profile-card-header";

// Mock data - em um app real, isso viria de uma API
const mockUserData = {
  // name: "João Silva",
  // email: "joao@email.com",
  // avatar: null, // Simulando usuário sem foto - altere para "/placeholder-avatar.jpg" para testar com foto
  level: 12,
  totalPoints: 2450,
  pointsToNextLevel: 550,
  // currentStreak: 7,
  // bestStreak: 21,
  // joinDate: "2024-01-15",
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
  // groups: [
  //   { id: 1, name: "Galera da Academia", members: 12, rank: 3 },
  //   { id: 2, name: "Time Nutrição", members: 8, rank: 1 },
  // ],
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return <div className="text-center text-muted-foreground">Usuário não encontrado</div>;
  const profile = await getProfileById(user.profile_id);
  if (!profile) return <div className="text-center text-muted-foreground">Perfil não encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header do Perfil */}
      <ProfileCardHeader
        avatar={user.avatar}
        email={user.email}
        name={user.name}

        level={mockUserData.level}

        current_streak={profile.streak.current_streak}
      />

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pontos Totais</p>
                <p className="text-2xl font-bold text-blue-400">{profile.score.toLocaleString()}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-400" />
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
      <GroupListCard groups={profile.groups} />
    </div>
  );
}
