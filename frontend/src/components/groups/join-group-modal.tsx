"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Link as LinkIcon } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (inviteCode: string) => Promise<void>;
  isLoading?: boolean;
}

export function JoinGroupModal({ isOpen, onClose, onJoinGroup, isLoading = false }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const validateInviteCode = (code: string): boolean => {
    // Código de convite deve ter pelo menos 6 caracteres (baseado no backend)
    if (!code.trim()) {
      setError('Código de convite é obrigatório');
      return false;
    }
    
    if (code.length < 6) {
      setError('Código de convite deve ter pelo menos 6 caracteres');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInviteCode(inviteCode)) return;

    try {
      await onJoinGroup(inviteCode);
      handleClose();
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
  };

  const handleInputChange = (value: string) => {
    setInviteCode(value.toUpperCase()); // Converter para maiúsculo para consistência
    if (error) {
      setError('');
    }
  };

  const formatInviteCode = (code: string) => {
    // Converte para maiúsculo e remove caracteres especiais, mantendo apenas alfanuméricos
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            Entrar em Grupo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Digite o código de convite que você recebeu para entrar no grupo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code" className="text-foreground">Código de Convite</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-code"
                placeholder="Ex: ABC123"
                value={inviteCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange(formatInviteCode(e.target.value))
                }
                className={`pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground ${error ? 'border-red-500' : ''}`}
                disabled={isLoading}
                maxLength={20}
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              O código de convite é fornecido pelo administrador do grupo
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground">Como funciona?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Peça o código para o administrador do grupo</li>
              <li>• Cole ou digite o código no campo acima</li>
              <li>• Você será adicionado automaticamente ao grupo</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !inviteCode.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar no Grupo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
