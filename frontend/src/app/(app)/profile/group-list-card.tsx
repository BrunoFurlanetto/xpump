import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

const GroupListCard = ({
  groups,
}: {
  groups: Array<{ id: number; name: string; member_count: number; position: number }>;
}) => {
  return (
    groups.length > 0 && (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trophy className="h-5 w-5 text-purple-400" />
            Grupos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.member_count} membros</p>
                  </div>
                  <Badge variant={group.position <= 3 ? "default" : "secondary"}>#{group.position}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  );
};

export default GroupListCard;
