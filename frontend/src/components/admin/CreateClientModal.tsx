"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminAPI, CreateClientData } from "@/lib/api/admin";

export function CreateClientModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateClientData>({
    name: "",
    cnpj: "",
    contact_email: "",
    phone: "",
    address: "",
    owner_username: "",
    owner_email: "",
    owner_password: "",
    owner_first_name: "",
    owner_last_name: "",
  });

  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientData) => AdminAPI.createClient(data),
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      setOpen(false);
      setFormData({
        name: "",
        cnpj: "",
        contact_email: "",
        phone: "",
        address: "",
        owner_username: "",
        owner_email: "",
        owner_password: "",
        owner_first_name: "",
        owner_last_name: "",
      });
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["admin", "system", "clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "system", "stats"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao criar cliente";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações dos dados do cliente
    if (!formData.name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    if (!formData.cnpj.trim()) {
      toast.error("CNPJ é obrigatório");
      return;
    }

    if (!formData.contact_email.trim()) {
      toast.error("Email de contato é obrigatório");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Endereço é obrigatório");
      return;
    }

    // Validações dos dados do owner
    if (!formData.owner_username.trim()) {
      toast.error("Username do proprietário é obrigatório");
      return;
    }

    if (!formData.owner_email.trim()) {
      toast.error("Email do proprietário é obrigatório");
      return;
    }

    if (!formData.owner_password.trim() || formData.owner_password.length < 6) {
      toast.error("Senha do proprietário deve ter no mínimo 6 caracteres");
      return;
    }

    if (!formData.owner_first_name.trim()) {
      toast.error("Nome do proprietário é obrigatório");
      return;
    }

    if (!formData.owner_last_name.trim()) {
      toast.error("Sobrenome do proprietário é obrigatório");
      return;
    }

    createClientMutation.mutate(formData);
  };

  const handleChange = (field: keyof CreateClientData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Empresa/Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Criar Nova Empresa/Cliente
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da empresa e do proprietário para criar um novo cliente no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Dados da Empresa */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Dados da Empresa</h3>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Academia FitPro"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                disabled={createClientMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">
                CNPJ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                required
                disabled={createClientMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">
                Email de Contato <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contato@empresa.com"
                value={formData.contact_email}
                onChange={(e) => handleChange("contact_email", e.target.value)}
                required
                disabled={createClientMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
                disabled={createClientMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Endereço <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro, cidade - UF"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
                disabled={createClientMutation.isPending}
              />
            </div>
          </div>

          {/* Dados do Proprietário */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Dados do Proprietário</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="owner_first_name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="owner_first_name"
                  placeholder="João"
                  value={formData.owner_first_name}
                  onChange={(e) => handleChange("owner_first_name", e.target.value)}
                  required
                  disabled={createClientMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_last_name">
                  Sobrenome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="owner_last_name"
                  placeholder="Silva"
                  value={formData.owner_last_name}
                  onChange={(e) => handleChange("owner_last_name", e.target.value)}
                  required
                  disabled={createClientMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="owner_username"
                placeholder="joaosilva"
                value={formData.owner_username}
                onChange={(e) => handleChange("owner_username", e.target.value)}
                required
                disabled={createClientMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="owner_email"
                type="email"
                placeholder="joao@email.com"
                value={formData.owner_email}
                onChange={(e) => handleChange("owner_email", e.target.value)}
                required
                disabled={createClientMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_password">
                Senha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="owner_password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.owner_password}
                onChange={(e) => handleChange("owner_password", e.target.value)}
                required
                minLength={6}
                disabled={createClientMutation.isPending}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createClientMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createClientMutation.isPending}>
              {createClientMutation.isPending ? "Criando..." : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
