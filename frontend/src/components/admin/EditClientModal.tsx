"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminAPI, CreateClientData } from "@/lib/api/admin";
import { toast } from "sonner";
import { Edit } from "lucide-react";

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  initialData: {
    name: string;
    cnpj: string;
    contact_email: string;
    phone: string;
    address: string;
    is_active: boolean;
  };
}

export function EditClientModal({ open, onOpenChange, clientId, initialData }: EditClientModalProps) {
  const [formData, setFormData] = useState(initialData);
  const queryClient = useQueryClient();

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateClientData>) => AdminAPI.updateClient(clientId, data),
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "client", clientId] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Cliente
          </DialogTitle>
          <DialogDescription>Atualize as informações do cliente abaixo.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações do Cliente</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Fantasia *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleChange("cnpj", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Cliente Ativo
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
