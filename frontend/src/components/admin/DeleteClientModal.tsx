"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AdminAPI } from "@/lib/api/admin";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
}

export function DeleteClientModal({ open, onOpenChange, clientId, clientName }: DeleteClientModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => AdminAPI.deleteClient(clientId),
    onSuccess: () => {
      toast.success("Cliente deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao deletar cliente");
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription className="pt-4">
            Tem certeza que deseja deletar o cliente <strong>{clientName}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita e todos os dados relacionados ao cliente serão removidos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deletando..." : "Deletar Cliente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
