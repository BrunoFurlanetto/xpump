"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, TrendingUp, Award, Utensils, Dumbbell } from "lucide-react";
import { getCurrentUser } from "../_actions/getCurrentUser";
import GroupListCard from "./group-list-card";
import ProfileCardHeader from "./profile-card-header";
import { useProfiles } from "@/hooks/useProfiles";
import { useEffect, useState } from "react";
import { ProfileSkeleton } from "./profile-skeleton";

// Mock data - em um app real, isso viria de uma API
const mockLevels = {
  achievements: [
    {
      id: 1,
      name: "Primeira Semana",
      description: "Complete 7 dias consecutivos",
      icon: "🔥",
      earned: true,
    },
    {
      id: 2,
      name: "Consistência",
      description: "30 treinos realizados",
      icon: "💪",
      earned: true,
    },
    {
      id: 3,
      name: "Nutri Expert",
      description: "50 refeições registradas",
      icon: "🥗",
      earned: true,
    },
    {
      id: 4,
      name: "Lenda",
      description: "100 treinos realizados",
      icon: "👑",
      earned: false,
    },
  ],
};

interface User {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export default function ProfilePage() {
  const { profile, isLoading, fetchProfile } = useProfiles();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (userData) {
        setUser(userData);
        fetchProfile(userData.profile_id);
      }
    });
  }, [fetchProfile]);

  if (isLoading || !profile) return <ProfileSkeleton />;
  if (!user) return <div className="text-center text-muted-foreground py-8">Usuário não encontrado</div>;

  console.log("Profile data:", profile);
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header do Perfil */}
      <ProfileCardHeader
        avatar={user.avatar}
        email={user.email}
        name={user.name}
        level={profile.level}
        current_streak={profile.workout_streak.current_streak}
      />

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
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

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Treinos</p>
                <p className="text-2xl font-bold text-green-400">{profile.workout_streak.current_streak}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Refeições</p>
                <p className="text-2xl font-bold text-purple-400">{profile.meal_streak.current_streak}</p>
              </div>
              <Utensils className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do Nível */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso do Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Nível {profile.level}</span>
              <span>{profile.points_to_next_level} pontos para o próximo nível</span>
            </div>
            <Progress value={(profile.score % 1000) / 10} max={100} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {profile.score.toLocaleString()} / {profile.score + profile.points_to_next_level} pontos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas da Semana */}
      <Card className="border-border">
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
                  {profile.workout_streak.weekly_expected - profile.workout_streak.weekly_remaining}/
                  {profile.workout_streak.weekly_expected}
                </span>
              </div>
              <Progress
                value={
                  ((profile.workout_streak.weekly_expected - profile.workout_streak.weekly_remaining) /
                    profile.workout_streak.weekly_expected) *
                  100
                }
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Refeições</span>
                <span className="text-sm text-muted-foreground">
                  {profile.meal_streak.weekly_expected - profile.meal_streak.weekly_remaining}/
                  {profile.meal_streak.weekly_expected}
                </span>
              </div>
              <Progress
                value={
                  ((profile.meal_streak.weekly_expected - profile.meal_streak.weekly_remaining) /
                    profile.meal_streak.weekly_expected) *
                  100
                }
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conquistas */}
      {/* TODO: DEIXEI COMO HIDDEN POIS AINDA NÂO FOI DESENVOLVIDO NA API */}
      <Card className="border-border hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Conquistas
          </CardTitle>
          <CardDescription>Seus marcos e realizações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockLevels.achievements.map((achievement) => (
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
