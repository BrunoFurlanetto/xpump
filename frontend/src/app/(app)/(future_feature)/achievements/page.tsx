"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Lock, Target, Flame, Utensils, Users, Zap } from "lucide-react";

export default function AchievementsPage() {
  const { achievements, isLoading, checkForNewAchievements } = useNotifications();

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked);

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      workout: Target,
      meal: Utensils,
      streak: Flame,
      social: Users,
      points: Zap,
    };

    const IconComponent = iconMap[category as keyof typeof iconMap] || Trophy;
    return IconComponent;
  };

  const getCategoryColor = (category: string) => {
    const colorMap = {
      workout: "text-blue-400",
      meal: "text-green-400",
      streak: "text-orange-400",
      social: "text-purple-400",
      points: "text-yellow-400",
    };

    return colorMap[category as keyof typeof colorMap] || "text-gray-400";
  };

  const getCategoryBg = (category: string) => {
    const bgMap = {
      workout: "bg-blue-500/10 border-blue-500/20",
      meal: "bg-green-500/10 border-green-500/20",
      streak: "bg-orange-500/10 border-orange-500/20",
      social: "bg-purple-500/10 border-purple-500/20",
      points: "bg-yellow-500/10 border-yellow-500/20",
    };

    return bgMap[category as keyof typeof bgMap] || "bg-gray-500/10 border-gray-500/20";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Conquistas</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-2 bg-muted rounded w-full" />
                  </div>
                </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Conquistas</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Desbloqueie conquistas através da sua dedicação e consistência
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={checkForNewAchievements} variant={"outline"} className="w-full sm:w-auto">
            <Trophy className="h-4 w-4 mr-2" />
            Verificar Progresso
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Desbloqueadas</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">{unlockedAchievements.length}</p>
              </div>
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{achievements.length}</p>
              </div>
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Progresso</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">
                  {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
                </p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pontos Ganhos</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">
                  {unlockedAchievements.reduce((sum, achievement) => sum + achievement.rewards.points, 0)}
                </p>
              </div>
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Conquistas Desbloqueadas
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400">
                {unlockedAchievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unlockedAchievements.map((achievement) => {
                const IconComponent = getCategoryIcon(achievement.category);
                return (
                  <Card
                    key={achievement.id}
                    className={`bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 relative overflow-hidden`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse" />

                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-full ${getCategoryBg(achievement.category)} border`}>
                          <IconComponent className={`h-6 w-6 ${getCategoryColor(achievement.category)}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground">{achievement.title}</h3>
                            <span className="text-2xl">{achievement.icon}</span>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs border-yellow-500/20 text-yellow-400">
                              +{achievement.rewards.points} pontos
                            </Badge>

                            {achievement.unlockedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(achievement.unlockedAt).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>

                          {achievement.rewards.title_unlock && (
                            <div className="mt-2">
                              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                                Título: {achievement.rewards.title_unlock}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Conquistas Disponíveis
            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
              {lockedAchievements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement) => {
              const IconComponent = getCategoryIcon(achievement.category);
              return (
                <Card key={achievement.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-full ${getCategoryBg(achievement.category)} border opacity-60`}>
                        <IconComponent className={`h-6 w-6 ${getCategoryColor(achievement.category)}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-muted-foreground">{achievement.title}</h3>
                          <span className="text-2xl opacity-60">{achievement.icon}</span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="text-muted-foreground">
                              {achievement.progress}% / {achievement.requirements.target}
                            </span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline" className="text-xs opacity-60">
                            +{achievement.rewards.points} pontos
                          </Badge>

                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {achievement.rewards.title_unlock && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs opacity-60">
                              Título: {achievement.rewards.title_unlock}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Continue Se Superando!</h3>
          <p className="text-muted-foreground mb-4">
            Cada treino e refeição te aproxima de novas conquistas. Mantenha a consistência!
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Target className="h-4 w-4 mr-2" />
            Ver Meu Progresso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
