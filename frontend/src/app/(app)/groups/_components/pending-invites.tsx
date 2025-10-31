"use client";

import { use, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, Clock, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Group } from "@/lib/api/groups";
import { useRouter } from "next/navigation";
import { useGroupsLoading } from "./groups-loading-context";
import { useGroups } from "@/hooks/useGroups";

interface PendingInvitesProps {
  groupsPromise: Promise<
    | {
        error: string;
        groups: Group[];
      }
    | {
        groups: Group[];
        error?: undefined;
      }
  >;
}

export function PendingInvites({ groupsPromise }: PendingInvitesProps) {
  const router = useRouter();
  const { respondToInvite } = useGroups();
  const groupsRequest = use(groupsPromise);
  const pendingGroups = groupsRequest.groups.filter((group) => group.pending);

  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const { startRefresh, startTransition } = useGroupsLoading();

  const handleInviteResponse = async (groupId: number, action: "accept" | "reject") => {
    setRespondingTo(groupId);

    try {
      await respondToInvite(groupId, action);

      const group = pendingGroups.find((g) => g.id === groupId);
      if (action === "accept") {
        toast.success(`Você entrou no grupo "${group?.name}"!`);
      } else {
        toast.success("Convite recusado");
      }

      // Show global loading overlay during refresh
      startRefresh();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao responder convite");
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Não renderizar nada se estiver carregando ou não houver convites
  if (pendingGroups.length === 0) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Convites Pendentes
          <Badge variant="secondary">{pendingGroups.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingGroups.map((group) => (
            <div key={group.id} className="border rounded-lg p-4 space-y-3">
              {/* Header do convite */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group.members.filter((m) => !m.pending).length} membros
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(group.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleInviteResponse(group.id, "accept")}
                  disabled={respondingTo === group.id}
                  className="flex-1"
                  size="sm"
                >
                  {respondingTo === group.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Aceitar
                </Button>
                <Button
                  onClick={() => handleInviteResponse(group.id, "reject")}
                  disabled={respondingTo === group.id}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
