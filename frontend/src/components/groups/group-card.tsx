"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Crown, 
  MoreVertical, 
  UserPlus, 
  Settings, 
  LogOut, 
  Calendar,
  Trophy,
  Shield
} from 'lucide-react';
import { Group } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface GroupCardProps {
  group: Group;
  onLeaveGroup?: (groupId: number) => Promise<void>;
  onEditGroup?: (group: Group) => void;
  onViewDetails?: (group: Group) => void;
  onInviteUsers?: (group: Group) => void;
}

export function GroupCard({ 
  group, 
  onLeaveGroup, 
  onEditGroup, 
  onViewDetails,
  onInviteUsers
}: GroupCardProps) {
  const { user } = useAuth();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isOwner = Number(user?.id) === group.owner;
  const isAdmin = group.members.find(member => member.id === Number(user?.id))?.is_admin;
  const canInvite = isOwner || isAdmin;
  const memberCount = group.members.length;

  const handleInviteUsers = () => {
    if (onInviteUsers) {
      onInviteUsers(group);
    }
  };

  const handleLeaveGroup = async () => {
    if (!onLeaveGroup) return;
    
    setIsLeaving(true);
    try {
      await onLeaveGroup(group.id);
      toast.success('Você saiu do grupo');
    } catch {
      toast.error('Erro ao sair do grupo');
    } finally {
      setIsLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
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
                    {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem onClick={() => onViewDetails?.(group)} className="text-popover-foreground">
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Ranking
                </DropdownMenuItem>
                {canInvite && (
                  <DropdownMenuItem onClick={handleInviteUsers} className="text-popover-foreground">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convidar Usuários
                  </DropdownMenuItem>
                )}
                {(isOwner || isAdmin) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEditGroup?.(group)} className="text-popover-foreground">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
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

        <CardContent className="space-y-3">
          {group.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {group.description}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Código de convite:</span>
              <code className="px-2 py-1 bg-muted/50 border border-border rounded text-xs font-mono text-foreground">
                {group.invite_code}
              </code>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Criado em:
              </span>
              <span className="text-foreground">{formatDate(group.created_at)}</span>
            </div>

            {/* Preview dos membros */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Membros ativos:</p>
              <div className="flex items-center gap-1">
                {group.members.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-5 w-5 sm:h-6 sm:w-6 border border-border">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                      {getInitials(member.username)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberCount > 3 && (
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      +{memberCount - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle >Sair do grupo?</AlertDialogTitle>
            <AlertDialogDescription >
              Você tem certeza que deseja sair do grupo "{group.name}"? 
              Você precisará de um novo convite para entrar novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isLeaving}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLeaving ? 'Saindo...' : 'Sair do Grupo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
