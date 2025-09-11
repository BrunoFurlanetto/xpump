"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  UserPlus, 
  Loader2,
  X,
  Crown,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  onInviteSent: () => void;
}

export function InviteUserModal({
  isOpen,
  onClose,
  groupName,
  onInviteSent
}: InviteUserModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Mock users para demonstração
  const mockUsers: User[] = [
    { id: 1, username: "joao.silva", email: "joao@xpump.com" },
    { id: 2, username: "maria.santos", email: "maria@xpump.com" },
    { id: 3, username: "pedro.costa", email: "pedro@xpump.com" },
    { id: 4, username: "ana.oliveira", email: "ana@xpump.com" },
    { id: 5, username: "carlos.ferreira", email: "carlos@xpump.com" },
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      // Simular busca - aqui seria uma chamada para a API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filtered = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filtered);
    } catch {
      toast.error('Erro ao buscar usuários');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchResults(searchResults.filter(u => u.id !== user.id));
    }
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Selecione pelo menos um usuário para convidar');
      return;
    }

    setIsSending(true);
    try {
      // Simular envio de convites - aqui seria uma chamada para a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${selectedUsers.length} convite(s) enviado(s) com sucesso!`);
      onInviteSent();
      onClose();
      
      // Resetar estado
      setSelectedUsers([]);
      setSearchResults([]);
      setSearchTerm('');
      setRole('member');
    } catch {
      toast.error('Erro ao enviar convites');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchResults([]);
    setSearchTerm('');
    setRole('member');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar para {groupName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Buscar usuários */}
          <div className="space-y-2">
            <Label>Buscar usuários</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome de usuário ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                size="sm"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Resultados da busca */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Resultados da busca</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {searchResults.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddUser(user)}
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usuários selecionados */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Usuários selecionados ({selectedUsers.length})</Label>
              <div className="space-y-1">
                {selectedUsers.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Papel/Role */}
          <div className="space-y-2">
            <Label>Papel no grupo</Label>
            <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Membro
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Administrador
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={selectedUsers.length === 0 || isSending}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar Convites
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
