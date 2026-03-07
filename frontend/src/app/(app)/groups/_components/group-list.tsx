"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { GroupCard } from "@/app/(app)/groups/_components/group-card";
import { Group } from "@/lib/api/groups";
import { CreateGroupModal } from "@/app/(app)/groups/_components/create-group-modal";

const GroupList = ({ groups }: { groups: Group[] }) => {
  const confirmedGroups = groups.filter((group) => !group.pending);
  const companyGroup = confirmedGroups.filter((group) => group.main === true);

  const otherGroups = confirmedGroups.filter((group) => group.main !== true);
  return (
    <>
      {/* Grupo da Empresa */}
      {companyGroup && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {companyGroup.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {/* Meus Grupos */}
      {otherGroups.length > 0 && (
        <div>
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
