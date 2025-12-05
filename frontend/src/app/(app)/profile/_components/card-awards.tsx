import { Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function CardAwards() {
  return (
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
  );
}
