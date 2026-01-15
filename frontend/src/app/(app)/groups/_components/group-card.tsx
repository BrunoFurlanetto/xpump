"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Crown, MoreVertical, UserPlus, Settings, LogOut, Calendar, Trophy, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InviteUserModal } from "./invite-user-modal";
import { Group } from "@/lib/api/groups";
import { useRouter } from "next/navigation";
import { useGroupsLoading } from "./groups-loading-context";
import { useLeaveGroup, useDeleteGroup } from "@/hooks/useGroupsQuery";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const leaveGroupMutation = useLeaveGroup();
  const deleteGroupMutation = useDeleteGroup();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { startRefresh, startTransition } = useGroupsLoading();

  const isOwner = Number(user?.id) === group.owner;
  const isAdmin = group.owner == Number(user?.id);
  const canInvite = isOwner || isAdmin;
  const canDelete = isOwner && !group.main; // Owner can delete only non-main groups

  const handleLeaveGroup = async () => {
    setIsLeaving(true);
    try {
      await leaveGroupMutation.mutateAsync(group.id);

      // Show global loading overlay during refresh
      startRefresh();
      startTransition(() => {
        router.refresh();
      });
    } catch {
      // Erro já tratado no hook
    } finally {
      setIsLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      await deleteGroupMutation.mutateAsync(group.id);

      // Show global loading overlay during refresh
      startRefresh();
      startTransition(() => {
        router.refresh();
      });
    } catch {
      // Erro já tratado no hook
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <InviteUserModal
        open={openInviteModal}
        close={() => setOpenInviteModal(false)}
        groupId={group.id}
        groupName={group.name}
        clientCode={group.client_code}
      />

      <Card className="group hover:shadow-lg transition-all duration-200 bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg">
                  {group.photo && <AvatarImage src={group.photo} alt={group.name} className="object-cover" />}
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(group.name)}
                  </AvatarFallback>
                </Avatar>
                {isOwner && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Crown className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors text-foreground truncate">
                  {group.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs bg-secondary/50 text-secondary-foreground">
                    {group.members_count} {group.members_count === 1 ? "membro" : "membros"}
                  </Badge>
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                      <Shield className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="text-popover-foreground"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Ranking
                </DropdownMenuItem>
                {canInvite && (
                  <DropdownMenuItem className="text-popover-foreground" onClick={() => setOpenInviteModal(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convidar Usuários
                  </DropdownMenuItem>
                )}
                {(isOwner || isAdmin) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        //() => onEditGroup?.(group)
                      }}
                      className="text-popover-foreground"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-400 focus:text-red-400 hover:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar Grupo
                    </DropdownMenuItem>
                  </>
                )}
                {!isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowLeaveDialog(true)}
                      className="text-red-400 focus:text-red-400 hover:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair do Grupo
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 cursor-pointer" onClick={() => router.push(`/groups/${group.id}`)}>
          {group.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{group.description}</p>}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Criado em:
              </span>
              <span className="text-foreground">{formatDate(group.created_at)}</span>
            </div>

            {/*   {/* Preview dos membros */}
            {/*   <div> */}
            {/*     <p className="text-xs text-muted-foreground mb-2">Membros ativos:</p> */}
            {/*     <div className="flex items-center gap-1"> */}
            {/*       {group.members.slice(0, 3).map((member) => ( */}
            {/*         <Avatar key={member.id} className="h-5 w-5 sm:h-6 sm:w-6 border border-border"> */}
            {/*           <AvatarFallback className="text-xs bg-gradient-to-br from-gray-500 to-gray-600 text-white"> */}
            {/*             {getInitials(member.username)} */}
            {/*           </AvatarFallback> */}
            {/*         </Avatar> */}
            {/*       ))} */}
            {/*       {group.members_count > 3 && ( */}
            {/*         <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-muted/50 border border-border flex items-center justify-center"> */}
            {/*           <span className="text-xs text-muted-foreground">+{group.members_count - 3}</span> */}
            {/*         </div> */}
            {/*       )} */}
            {/*     </div> */}
            {/*   </div> */}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja sair do grupo "{group.name}"? Você precisará de um novo convite para entrar
              novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup} disabled={isLeaving} className="bg-red-600 hover:bg-red-700">
              {isLeaving ? "Saindo..." : "Sair do Grupo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja deletar o grupo "{group.name}"? Esta ação não pode ser desfeita e todos os
              membros serão removidos do grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deletando..." : "Deletar Grupo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
