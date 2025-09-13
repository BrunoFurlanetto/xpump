"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Check, 
  X, 
  Clock,
  Users,
  Crown,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface GroupInvite {
  id: number;
  group: {
    id: number;
    name: string;
    description: string;
    memberCount: number;
  };
  invitedBy: {
    id: number;
    username: string;
    email: string;
  };
  role: 'member' | 'admin';
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface PendingInvitesProps {
  onInviteResponse?: () => void;
}

export function PendingInvites({ onInviteResponse }: PendingInvitesProps) {
  const [invites, setInvites] = useState<GroupInvite[]>([
    {
      id: 1,
      group: {
        id: 1,
        name: "Equipe de Desenvolvimento",
        description: "Grupo para devs da empresa",
        memberCount: 12
      },
      invitedBy: {
        id: 2,
        username: "ana.oliveira",
        email: "ana@xpump.com"
      },
      role: 'member',
      createdAt: '2025-09-10T14:30:00Z',
      status: 'pending'
    },
    {
      id: 2,
      group: {
        id: 2,
        name: "Fitness Challenge 2025",
        description: "Desafio de fitness da empresa",
        memberCount: 25
      },
      invitedBy: {
        id: 3,
        username: "carlos.ferreira",
        email: "carlos@xpump.com"
      },
      role: 'admin',
      createdAt: '2025-09-09T09:15:00Z',
      status: 'pending'
    }
  ]);

  const [respondingTo, setRespondingTo] = useState<number | null>(null);

  const handleInviteResponse = async (inviteId: number, action: 'accept' | 'decline') => {
    setRespondingTo(inviteId);
    
    try {
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar estado local
      setInvites(invites.map(invite => 
        invite.id === inviteId 
          ? { ...invite, status: action === 'accept' ? 'accepted' : 'declined' }
          : invite
      ));
      
      const invite = invites.find(i => i.id === inviteId);
      if (action === 'accept') {
        toast.success(`Você entrou no grupo "${invite?.group.name}"!`);
      } else {
        toast.success('Convite recusado');
      }
      
      onInviteResponse?.();
    } catch {
      toast.error('Erro ao responder convite');
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingInvites = invites.filter(invite => invite.status === 'pending');

  if (pendingInvites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convites Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum convite pendente</p>
            <p className="text-sm">Quando alguém te convidar para um grupo, aparecerá aqui!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Convites Pendentes
          <Badge variant="secondary">{pendingInvites.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingInvites.map(invite => (
            <div 
              key={invite.id}
              className="border rounded-lg p-4 space-y-3"
            >
              {/* Header do convite */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">{invite.group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {invite.group.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {invite.group.memberCount} membros
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(invite.createdAt)}
                    </span>
                  </div>
                </div>
                
                <Badge 
                  variant={invite.role === 'admin' ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {invite.role === 'admin' ? (
                    <Crown className="h-3 w-3" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  {invite.role === 'admin' ? 'Admin' : 'Membro'}
                </Badge>
              </div>

              {/* Informações de quem convidou */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Convidado por:</span>
                <span className="font-medium">{invite.invitedBy.username}</span>
                <span className="text-muted-foreground">({invite.invitedBy.email})</span>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleInviteResponse(invite.id, 'accept')}
                  disabled={respondingTo === invite.id}
                  className="flex-1"
                  size="sm"
                >
                  {respondingTo === invite.id ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Aceitar
                </Button>
                <Button
                  onClick={() => handleInviteResponse(invite.id, 'decline')}
                  disabled={respondingTo === invite.id}
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
