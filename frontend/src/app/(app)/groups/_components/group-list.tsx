"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown } from "lucide-react";
import { GroupCard } from "@/app/(app)/groups/_components/group-card";
import React from "react";
import { Group } from "../../_actions/groups";
import { CreateGroupModal } from "@/app/(app)/groups/_components/create-group-modal";

const GroupList = ({ groupsPromise }: { groupsPromise: Promise<{ groups: Group[] }> }) => {
  const { groups } = React.use(groupsPromise);
  const confirmedGroups = groups.filter((group) => !group.pending);
  const companyGroup = confirmedGroups.find((group) => group.main === true);

  const otherGroups = confirmedGroups.filter((group) => group.main !== true);
  return (
    <>
      {/* Grupo da Empresa */}
      {companyGroup && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Grupo da Empresa</h2>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              Oficial
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <GroupCard group={companyGroup} />
          </div>
        </div>
      )}

      {/* Meus Grupos */}
      {otherGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Meus Grupos</h2>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {otherGroups.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {otherGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {groups.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-6 sm:p-8 text-center">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhum grupo</h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Você ainda não participa de nenhum grupo. Crie um novo grupo ou aguarde um convite!
            </p>
            <CreateGroupModal />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default GroupList;
