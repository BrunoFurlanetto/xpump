"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGroupsLoading } from "./groups-loading-context";
import { useGroupsContext } from "@/context/groupsContext";

interface InviteUserModalProps {
  open?: boolean;
  close?: () => void;
  groupId: number;
  groupName: string;
}

export function InviteUserModal({ groupId, groupName, open, close }: InviteUserModalProps) {
  const router = useRouter();
  const { inviteUser } = useGroupsContext();
  const [username, setUsername] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { startRefresh, startTransition } = useGroupsLoading();

  const handleSendInvite = async () => {
    if (!username.trim()) {
      toast.error("Digite um nome de usuário");
      return;
    }

    setIsSending(true);
    try {
      await inviteUser(groupId, username.trim());
      toast.success(`Convite enviado para ${username}!`);
      setUsername("");

      // Show global loading overlay during refresh
      startRefresh();
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Erro ao enviar convite");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    close?.();
    setUsername("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSending) {
      handleSendInvite();
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
          <div className="space-y-2 text-foreground">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              placeholder="Digite o username do usuário..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">Digite o username exato do usuário que você deseja convidar</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSending}>
              Cancelar
            </Button>
            <Button onClick={handleSendInvite} disabled={isSending || !username.trim()}>
              {isSending ? (
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
