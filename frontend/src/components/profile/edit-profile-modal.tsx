"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User, X } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useProfilesQuery";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: number | string;
  currentData: {
    photo: string | null;
    height: number | null;
    weight: number | null;
    name: string;
  };
}

export function EditProfileModal({ isOpen, onClose, profileId, currentData }: EditProfileModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentData.photo);
  const [height, setHeight] = useState<string>(currentData.height?.toString() || "");
  const [weight, setWeight] = useState<string>(currentData.weight?.toString() || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useUpdateProfile();

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
    setPreviewUrl(currentData.photo);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      const updateData: any = {};

      if (height && height !== currentData.height?.toString()) {
        const heightNum = parseFloat(height);
        if (isNaN(heightNum) || heightNum <= 0) {
          toast.error("Altura inválida");
          return;
        }
        updateData.height = heightNum;
      }

      if (weight && weight !== currentData.weight?.toString()) {
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
          toast.error("Peso inválido");
          return;
        }
        updateData.weight = weightNum;
      }

      if (selectedImage) {
        updateData.photo = selectedImage;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("Nenhuma alteração foi feita");
        onClose();
        return;
      }

      await updateProfileMutation.mutateAsync({
        profileId,
        data: updateData,
      });

      onClose();
      // Reset form
      setSelectedImage(null);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  const handleClose = () => {
    if (!updateProfileMutation.isPending) {
      setSelectedImage(null);
      setPreviewUrl(currentData.photo);
      setHeight(currentData.height?.toString() || "");
      setWeight(currentData.weight?.toString() || "");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32 ring-4 ring-background border-2 border-border">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={currentData.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                    <User className="h-16 w-16" />
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

          {/* Height and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={updateProfileMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateProfileMutation.isPending} className="gap-2">
            {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
