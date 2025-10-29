import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Users } from "lucide-react";
import React from "react";
import ButtonGroupInside from "./button-group-inside";

const GroupListCard = ({
  groups,
}: {
  groups: Array<{ id: number; name: string; member_count: number; position: number }>;
}) => {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Meus Grupos
        </CardTitle>
        <CardDescription>Grupos que você participa e seu ranking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold">{group.name}</h4>
                  <p className="text-sm text-muted-foreground">{group.member_count} membros</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-yellow-400" />
                <span className="font-semibold">#{group.position}</span>
              </div>
            </div>
          ))}

          <ButtonGroupInside />
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupListCard;
