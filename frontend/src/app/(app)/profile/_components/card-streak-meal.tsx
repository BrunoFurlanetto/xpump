import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Flame, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CardStreakMealProps {
  meal_streak: {
    current_streak: number;
    longest_streak: number;
    weekly_expected: number;
    weekly_remaining: number;
  };
}
export default function CardStreakMeal({ meal_streak }: CardStreakMealProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Utensils className="h-5 w-5 text-orange-400" />
          Sequência de Refeições
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Sequência Atual</p>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{meal_streak.current_streak} dias</span>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm text-muted-foreground">Recorde</p>
            <div className="flex items-center gap-2 justify-end">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{meal_streak.longest_streak} dias</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso Semanal</span>
            <span className="text-muted-foreground">
              {meal_streak.weekly_expected - meal_streak.weekly_remaining}/{meal_streak.weekly_expected}
            </span>
          </div>
          <Progress
            value={((meal_streak.weekly_expected - meal_streak.weekly_remaining) / meal_streak.weekly_expected) * 100}
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
