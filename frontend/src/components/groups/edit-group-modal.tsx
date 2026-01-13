"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Users, X } from "lucide-react";
import { useUpdateGroup } from "@/hooks/useGroupsQuery";
import { toast } from "sonner";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  currentData: {
    name: string;
    description: string;
    photo?: string | null;
  };
}

export function EditGroupModal({ isOpen, onClose, groupId, currentData }: EditGroupModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentData.photo || null);
  const [name, setName] = useState(currentData.name);
  const [description, setDescription] = useState(currentData.description);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateGroupMutation = useUpdateGroup();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem válida");
        return;
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(currentData.photo || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    try {
      const updateData: any = {};

      if (name.trim() && name !== currentData.name) {
        if (name.trim().length < 3) {
          toast.error("O nome deve ter pelo menos 3 caracteres");
          return;
        }
        updateData.name = name.trim();
      }

      if (description.trim() && description !== currentData.description) {
        updateData.description = description.trim();
      }

      if (selectedImage) {
        updateData.photo = selectedImage;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("Nenhuma alteração foi feita");
        onClose();
        return;
      }

      await updateGroupMutation.mutateAsync({
        groupId,
        data: updateData,
      });

      onClose();
      // Reset form
      setSelectedImage(null);
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error);
    }
  };

  const handleClose = () => {
    if (!updateGroupMutation.isPending) {
      setSelectedImage(null);
      setPreviewUrl(currentData.photo || null);
      setName(currentData.name);
      setDescription(currentData.description);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32 ring-4 ring-background border-2 border-border">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-bold">
                    {getInitials(name)}
                  </AvatarFallback>
                )}
              </Avatar>

              {selectedImage && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                {previewUrl ? "Alterar Foto" : "Adicionar Foto"}
              </Button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo</Label>
            <Input
              id="name"
              placeholder="Nome do grupo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Group Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={updateGroupMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateGroupMutation.isPending} className="gap-2">
            {updateGroupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
