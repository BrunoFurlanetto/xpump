"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Users } from "lucide-react";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { CreateGroupData } from "@/lib/api/groups";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGroupsLoading } from "./groups-loading-context";
import { useCreateGroup } from "@/hooks/useGroupsQuery";

export function CreateGroupModal() {
  const router = useRouter();
  const createGroup = useCreateGroup();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateGroupData>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<CreateGroupData>>({});
  const { startRefresh, startTransition } = useGroupsLoading();

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateGroupData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do grupo é obrigatório";
    } else if (formData.name.length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    } else if (formData.name.length > 50) {
      newErrors.name = "Nome deve ter no máximo 50 caracteres";
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = "Descrição deve ter no máximo 200 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createGroup.mutateAsync(formData);
      handleClose();

      // Show global loading overlay during refresh
      startRefresh();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      // Erro já tratado no hook
    }
  };

  const handleClose = () => {
    if (!createGroup.isPending) {
      setFormData({ name: "", description: "" });
      setErrors({});
      setIsOpen(false);
    }
  };

  const handleInputChange = (field: keyof CreateGroupData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"} className="w-full cursor-pointer sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Criar Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Criar Novo Grupo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Crie um grupo para competir e treinar com seus amigos. Você será o administrador do grupo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-foreground">
              Nome do Grupo *
            </Label>
            <Input
              id="group-name"
              placeholder="Ex: Galera da Academia"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("name", e.target.value)}
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.name ? "border-red-500" : ""
              }`}
              disabled={createGroup.isPending}
              maxLength={50}
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
            <p className="text-xs text-muted-foreground">{formData.name.length}/50 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description" className="text-foreground">
              Descrição (opcional)
            </Label>
            <Textarea
              id="group-description"
              placeholder="Conte um pouco sobre o grupo..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.description ? "border-red-500" : ""
              }`}
              disabled={createGroup.isPending}
              maxLength={200}
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
            <p className="text-xs text-muted-foreground">{formData.description.length}/200 caracteres</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createGroup.isPending}
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createGroup.isPending || !formData.name.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Grupo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
