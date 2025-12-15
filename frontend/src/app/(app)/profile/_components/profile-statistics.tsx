import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Dumbbell, Utensils } from "lucide-react";

interface ProfileStatisticsProps {
  score: number;
  current_workout_streak: number;
  current_meal_streak: number;
}

export default function ProfileStatistics({
  score,
  current_workout_streak,
  current_meal_streak,
}: ProfileStatisticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pontos Totais</p>
              <p className="text-2xl font-bold text-blue-400">{score.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-green-400">{current_workout_streak}</p>
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
              <p className="text-2xl font-bold text-purple-400">{current_meal_streak}</p>
            </div>
            <Utensils className="h-8 w-8 text-purple-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
