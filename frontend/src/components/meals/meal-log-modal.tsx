"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Utensils, Camera, Upload, X, Clock, Share2 } from "lucide-react";
import { CreateMealData, MealType } from "@/hooks/useMealsQuery";

interface MealLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMealData) => Promise<void>;
  mealTypes: MealType[];
  isLoading?: boolean;
}

export function MealLogModal({ isOpen, onClose, onSubmit, mealTypes, isLoading = false }: MealLogModalProps) {
  // Inicializa com horário atual
  const [formData, setFormData] = useState({
    meal_type: "",
    meal_date: getCurrentDateTime(),
    comments: "",
  });

  // Função para obter data/hora atual no formato correto
  function getCurrentDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shareToFeed, setShareToFeed] = useState(true); // Padrão: compartilhar
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meal_type) {
      newErrors.meal_type = "Tipo de refeição é obrigatório";
    }

    if (!formData.meal_date) {
      newErrors.meal_date = "Data e hora da refeição são obrigatórias";
    }

    // Comments is optional in the API, so we don't validate it

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submitData: CreateMealData = {
        meal_type: parseInt(formData.meal_type), // Convert to number
        meal_time: formData.meal_date,
        comments: formData.comments,
        photo: mealPhoto || undefined,
        share_to_feed: shareToFeed,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error("Erro ao submeter refeição:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      meal_type: "",
      meal_date: getCurrentDateTime(), // Reset para horário atual
      comments: "",
    });
    setMealPhoto(null);
    setImagePreview(null);
    setShareToFeed(true); // Reset para padrão
    setErrors({});
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors({ ...errors, image: "Imagem deve ter menos de 5MB" });
        return;
      }

      setMealPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear image error if it exists
      if (errors.image) {
        const newErrors = { ...errors };
        delete newErrors.image;
        setErrors(newErrors);
      }
    }
  };

  const removeImage = () => {
    setMealPhoto(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Utensils className="h-5 w-5 text-primary" />
            Registrar Refeição
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Registre sua refeição e ganhe pontos por uma alimentação saudável!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Refeição */}
          <div className="space-y-2">
            <Label className="text-foreground">Tipo de Refeição *</Label>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map((mealType) => (
                <Button
                  key={mealType.id}
                  type="button"
                  variant={formData.meal_type === mealType.id ? "default" : "outline"}
                  onClick={() => {
                    console.log("🍽️ Tipo de refeição selecionado:", mealType.id, mealType.name);
                    setFormData({ ...formData, meal_type: mealType.id });
                  }}
                  className={`h-auto p-3 flex-col gap-1 ${
                    formData.meal_type === mealType.id
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                  disabled={isLoading}
                >
                  <span className="text-lg">{mealType.icon}</span>
                  <span className="text-xs font-medium">{mealType.name}</span>
                  <span className="text-xs opacity-70">{mealType.timeRange}</span>
                </Button>
              ))}
            </div>
            {errors.meal_type && <p className="text-sm text-red-400">{errors.meal_type}</p>}
            {/* Debug info */}
            <p className="text-xs text-muted-foreground">
              Selecionado: {formData.meal_type || "Nenhum"} | Tipos disponíveis: {mealTypes.length}
            </p>
          </div>

          {/* Data e Hora (readonly - horário atual) */}
          <div className="space-y-2">
            <Label htmlFor="meal_date" className="text-foreground">
              Horário da Refeição
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="meal_date"
                type="datetime-local"
                value={formData.meal_date}
                readOnly
                className="w-full pl-10 pr-3 py-2 bg-muted/50 border border-border rounded-md text-foreground cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">A refeição será registrada com o horário atual</p>
          </div>

          {/* Foto da Refeição */}
          <div className="space-y-2">
            <Label className="text-foreground">Foto da Refeição (opcional)</Label>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Adicione uma foto da sua refeição</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Escolher Foto
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Foto da refeição"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading}
            />

            {errors.image && <p className="text-sm text-red-400">{errors.image}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-foreground">
              Descrição da Refeição (opcional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Descreva o que você comeu: ingredientes, preparo, como se sentiu..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className={`min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.comments ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.comments && <p className="text-sm text-red-400">{errors.comments}</p>}
            <p className="text-xs text-muted-foreground">
              Seja específico para ajudar a comunidade e acompanhar sua evolução nutricional
            </p>
          </div>

          {/* Compartilhar no feed */}
          <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Checkbox
              id="shareToFeedMeal"
              checked={shareToFeed}
              onCheckedChange={(checked) => setShareToFeed(checked === true)}
            />
            <div className="flex-1">
              <label
                htmlFor="shareToFeedMeal"
                className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
              >
                <Share2 className="h-4 w-4 text-primary" />
                Compartilhar no feed
              </label>
              <p className="text-xs text-muted-foreground">Inspire outros com suas escolhas saudáveis!</p>
            </div>
          </div>

          {/* Info sobre pontos */}
          <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-foreground">🍎 Sistema de Pontuação</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Café da Manhã: 25 pontos</li>
              <li>• Almoço: 30 pontos</li>
              <li>• Lanche: 20 pontos</li>
              <li>• Jantar: 35 pontos</li>
              <li>• Bônus por completar todas as refeições do dia!</li>
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
              disabled={isLoading || !formData.meal_type}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() =>
                console.log("🔍 Estado do form no submit:", {
                  meal_type: formData.meal_type,
                  disabled: isLoading || !formData.meal_type,
                  isLoading,
                })
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Refeição
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
