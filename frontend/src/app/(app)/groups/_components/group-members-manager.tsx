"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Crown,
  Shield,
  MoreVertical,
  UserMinus,
  UserCheck,
  UserX,
  Filter,
  UserPlus,
} from "lucide-react";
import { InviteUserModal } from "./invite-user-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { GroupMember } from "@/lib/api/groups";
import { useGroupsContext } from "@/context/groupsContext";

interface GroupMembersManagerProps {
  groupId: number;
  groupName: string;
  members: GroupMember[];
  currentUserId: number;
  currentUserRole: "owner" | "admin" | "member";
  onMemberUpdate: () => void;
}

export function GroupMembersManager({
  groupId,
  groupName,
  members,
  currentUserId,
  currentUserRole,
  onMemberUpdate,
}: GroupMembersManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "admin" | "member">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { updateMember, removeMember, isSubmitting } = useGroupsContext();

  //   const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = currentUserRole === "owner";

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "owner" && member.id === members.find((m) => m.is_admin && m.id === currentUserId)?.id) ||
      (roleFilter === "admin" && member.is_admin) ||
      (roleFilter === "member" && !member.is_admin);

    return matchesSearch && matchesRole;
  });

  const handlePromoteToAdmin = async (memberId: number) => {
    setActionLoading(memberId);
    try {
      await updateMember(groupId, memberId, { is_admin: true });
      toast.success("Membro promovido a administrador");
      onMemberUpdate();
    } catch (error) {
      toast.error("Erro ao promover membro");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteAdmin = async (memberId: number) => {
    setActionLoading(memberId);
    try {
      await updateMember(groupId, memberId, { is_admin: false });
      toast.success("Administrador rebaixado a membro");
      onMemberUpdate();
    } catch (error) {
      toast.error("Erro ao rebaixar administrador");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setActionLoading(memberId);
    try {
      await removeMember(groupId, memberId);
      toast.success("Membro removido do grupo");
      onMemberUpdate();
    } catch (error) {
      toast.error("Erro ao remover membro");
    } finally {
      setActionLoading(null);
    }
  };

  const getMemberRole = (member: GroupMember) => {
    if (member.id === currentUserId && isOwner) return "owner";
    if (member.is_admin) return "admin";
    return "member";
  };

  const canManageMember = (member: GroupMember) => {
    if (member.id === currentUserId) return false; // Não pode gerenciar a si mesmo

    const memberRole = getMemberRole(member);

    if (isOwner) {
      return true; // Owner pode gerenciar todos
    } else if (currentUserRole === "admin") {
      return memberRole === "member"; // Admin só pode gerenciar membros
    }

    return false;
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros do Grupo
              <Badge variant="secondary">{members.length}</Badge>
            </CardTitle>
            <Button onClick={() => setShowInviteModal(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>

          {/* Filtros e busca */}
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRoleFilter("all")}>Todos os papéis</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter("owner")}>
                  <Crown className="h-4 w-4 mr-2" />
                  Dono
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter("admin")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Administradores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter("member")}>
                  <Users className="h-4 w-4 mr-2" />
                  Membros
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const memberRole = getMemberRole(member);
              const canManage = canManageMember(member);
              const isLoading = actionLoading === member.id || isSubmitting;

              return (
                <div key={member.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-sm">{member.username.charAt(0).toUpperCase()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate max-w-[160px] sm:max-w-[220px]">
                              {member.username}
                            </span>
                            {member.id === currentUserId && (
                              <Badge variant="outline" className="text-xs">
                                Você
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-[220px] sm:max-w-sm">
                            {member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Entrou em {new Date(member.joined_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>

                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isLoading} className="h-8 w-8">
                                {isLoading ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.is_admin
                                ? isOwner && (
                                    <DropdownMenuItem
                                      onClick={() => handleDemoteAdmin(member.id)}
                                      className="text-orange-600"
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Remover Admin
                                    </DropdownMenuItem>
                                  )
                                : isOwner && (
                                    <DropdownMenuItem
                                      onClick={() => handlePromoteToAdmin(member.id)}
                                      className="text-blue-600"
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Promover a Admin
                                    </DropdownMenuItem>
                                  )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remover do Grupo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant={memberRole === "owner" ? "default" : memberRole === "admin" ? "secondary" : "outline"}
                      className="flex items-center gap-1"
                    >
                      {memberRole === "owner" && <Crown className="h-3 w-3" />}
                      {memberRole === "admin" && <Shield className="h-3 w-3" />}
                      {memberRole === "member" && <Users className="h-3 w-3" />}
                      {memberRole === "owner" ? "Dono" : memberRole === "admin" ? "Admin" : "Membro"}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum membro encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InviteUserModal
        open={showInviteModal}
        close={() => setShowInviteModal(false)}
        groupId={groupId}
        groupName={groupName}
      />
    </>
  );
}
