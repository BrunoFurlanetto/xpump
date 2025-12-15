import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CardProgressLevelProps {
  level: number;
  points_to_next_level: number;
  score: number;
}

export default function CardProgressLevel({ level, points_to_next_level, score }: CardProgressLevelProps) {
  const levelProgress = ((score % 100) / 100) * 100;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Progresso de Nível
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Nível {level}</span>
          <span className="text-muted-foreground">Nível {level + 1}</span>
        </div>
        <Progress value={levelProgress} className="h-3" />
        <p className="text-sm text-center text-muted-foreground">{points_to_next_level} pontos para o próximo nível</p>
      </CardContent>
    </Card>
  );
}
