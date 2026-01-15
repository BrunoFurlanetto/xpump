"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Copy, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useInviteUser } from "@/hooks/useGroupsQuery";

interface InviteUserModalProps {
  open?: boolean;
  close?: () => void;
  groupId: number;
  groupName: string;
  clientCode?: string | null;
}

export function InviteUserModal({ groupId, groupName, clientCode, open, close }: InviteUserModalProps) {
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState(false);
  const inviteUser = useInviteUser();

  const handleSendInvite = async () => {
    if (!username.trim()) {
      toast.error("Digite um nome de usuário");
      return;
    }

    try {
      await inviteUser.mutateAsync({ groupId, username: username.trim() });
      setUsername("");
      close?.();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleClose = () => {
    if (!inviteUser.isPending) {
      close?.();
      setUsername("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !inviteUser.isPending) {
      handleSendInvite();
    }
  };

  const handleCopyLink = async () => {
    if (!clientCode) return;

    const registerUrl = `${window.location.origin}/register?client_code=${clientCode}`;

    try {
      await navigator.clipboard.writeText(registerUrl);
      setCopied(true);
      toast.success("Link copiado!", {
        description: "Compartilhe este link para novos usuários se cadastrarem",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5" />
            Convidar para {groupName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {clientCode && (
            <div className="space-y-2">
              <Label className="text-foreground">Link de Cadastro</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/register?client_code=${clientCode}`}
                  className="font-mono text-xs"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleCopyLink} className="flex-shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Compartilhe este link para novos usuários se cadastrarem automaticamente na empresa
              </p>
            </div>
          )}

          <div className="space-y-2 text-foreground">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              placeholder="Digite o username do usuário..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={inviteUser.isPending}
            />
            <p className="text-xs text-muted-foreground">Digite o username exato do usuário que você deseja convidar</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={inviteUser.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSendInvite} disabled={inviteUser.isPending || !username.trim()}>
              {inviteUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
