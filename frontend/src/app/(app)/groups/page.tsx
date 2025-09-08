"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Crown,
  Trophy,
  Target,
  Star,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useGroups, Group } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { GroupCard } from '@/components/groups/group-card';
import { CreateGroupModal } from '@/components/groups/create-group-modal';
import { JoinGroupModal } from '@/components/groups/join-group-modal';
import { GroupDetails } from '@/components/groups/group-details';
import { toast } from 'sonner';

// Dados mock para grupos da empresa (fixo)
const companyGroup: Group = {
  id: 0,
  name: "XPump Company",
  description: "Grupo oficial da empresa para todos os funcionários",
  created_by: 1,
  owner: 1,
  invite_code: "XPUMP2024",
  created_at: "2024-01-01T00:00:00Z",
  members: [
    { id: 1, username: "admin", email: "admin@xpump.com", is_admin: true, joined_at: "2024-01-01T00:00:00Z" },
    { id: 2, username: "user1", email: "user1@xpump.com", is_admin: false, joined_at: "2024-01-15T00:00:00Z" },
    { id: 3, username: "user2", email: "user2@xpump.com", is_admin: false, joined_at: "2024-02-01T00:00:00Z" },
  ]
};

export default function GroupsPage() {
  const { user } = useAuth();
  const { groups, loading, error, createGroup, joinGroup, leaveGroup } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Combinar grupo da empresa com grupos do usuário
  const allGroups = [companyGroup, ...groups];
  const userGroups = allGroups.filter(group => 
    group.members.some(member => member.id === Number(user?.id))
  );

  const handleCreateGroup = async (data: { name: string; description: string }) => {
    setIsCreating(true);
    try {
      await createGroup(data);
      toast.success('Grupo criado com sucesso!');
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar grupo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (inviteCode: string) => {
    setIsJoining(true);
    try {
      await joinGroup(inviteCode);
      toast.success('Você entrou no grupo!');
      setShowJoinModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao entrar no grupo');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      await leaveGroup(groupId);
      toast.success('Você saiu do grupo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sair do grupo');
    }
  };

  // Se um grupo está selecionado, mostrar detalhes
  if (selectedGroup) {
    return (
      <GroupDetails 
        group={selectedGroup} 
        onBack={() => setSelectedGroup(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Grupos</h1>
          <p className="text-muted-foreground">Conecte-se e treine com outros atletas.</p>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Grupos</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Conecte-se e treine com outros atletas. Compete em grupos e conquiste o topo!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setShowJoinModal(true)} 
              variant="outline"
              className="w-full sm:w-auto border-muted-foreground/20 hover:border-muted-foreground/40 text-foreground"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Entrar em Grupo
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Grupo
            </Button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Meus Grupos</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">{userGroups.length}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Melhor Posição</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-400">#3</p>
                </div>
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total de Membros</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    {userGroups.reduce((total, group) => total + group.members.length, 0)}
                  </p>
                </div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pontos da Semana</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-400">1,250</p>
                </div>
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Erro */}
        {error && (
          <Card className="border-red-500/20 bg-red-500/10">
            <CardContent className="p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Grupos */}
        <div className="space-y-6">
          {/* Grupo da Empresa */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Grupo da Empresa</h2>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Oficial
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <GroupCard
                group={companyGroup}
                onLeaveGroup={handleLeaveGroup}
                onViewDetails={(group) => setSelectedGroup(group)}
              />
            </div>
          </div>

          {/* Meus Grupos */}
          {userGroups.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Meus Grupos</h2>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                  {userGroups.length - 1}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {userGroups
                  .filter(group => group.id !== 0) // Excluir grupo da empresa
                  .map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onLeaveGroup={handleLeaveGroup}
                      onEditGroup={(group) => console.log('Editar:', group)}
                      onViewDetails={(group) => setSelectedGroup(group)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {userGroups.length === 1 && (
            <Card className="bg-card border-border">
              <CardContent className="p-6 sm:p-8 text-center">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhum grupo adicional</h3>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  Você ainda não participa de grupos adicionais. Crie um novo grupo ou peça um convite para amigos!
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button 
                    onClick={() => setShowJoinModal(true)} 
                    variant="outline"
                    className="w-full sm:w-auto border-muted-foreground/20 hover:border-muted-foreground/40 text-foreground"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Entrar em Grupo
                  </Button>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Grupo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dicas */}
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                Dicas para Grupos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Como criar um grupo eficaz:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Escolha um nome motivador e descritivo</li>
                    <li>• Defina metas claras para o grupo</li>
                    <li>• Compartilhe o código de convite com amigos</li>
                    <li>• Mantenha a interação ativa no feed</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Benefícios dos grupos:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Competição saudável aumenta motivação</li>
                    <li>• Apoio mútuo para manter consistência</li>
                    <li>• Rankings semanais e mensais</li>
                    <li>• Conquistas em grupo exclusivas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
        isLoading={isCreating}
      />

      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinGroup={handleJoinGroup}
        isLoading={isJoining}
      />
    </>
  );
}
