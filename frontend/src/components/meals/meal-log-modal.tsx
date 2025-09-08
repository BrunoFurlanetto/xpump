"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Utensils, 
  Camera,
  Upload,
  X,
  Clock
} from 'lucide-react';
import { CreateMealData, MealType } from '@/hooks/useMeals';

interface MealLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMealData) => Promise<void>;
  mealTypes: MealType[];
  isLoading?: boolean;
}

export function MealLogModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mealTypes,
  isLoading = false 
}: MealLogModalProps) {
  const [formData, setFormData] = useState({
    meal_type: '',
    meal_date: '',
    comments: ''
  });
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meal_type) {
      newErrors.meal_type = 'Tipo de refeição é obrigatório';
    }

    if (!formData.meal_date) {
      newErrors.meal_date = 'Data e hora da refeição são obrigatórias';
    }

    if (!formData.comments.trim()) {
      newErrors.comments = 'Descrição da refeição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData: CreateMealData = {
        meal_type: formData.meal_type,
        meal_date: formData.meal_date,
        comments: formData.comments,
        photo: mealPhoto || undefined
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('Erro ao submeter refeição:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      meal_type: '',
      meal_date: '',
      comments: ''
    });
    setMealPhoto(null);
    setImagePreview(null);
    setErrors({});
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({ ...errors, image: 'Imagem deve ter menos de 5MB' });
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
      fileInputRef.current.value = '';
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const suggestTimeForMealType = (mealType: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const defaultTimes = {
      breakfast: '08:00',
      lunch: '12:00',
      snack: '16:00',
      dinner: '19:00'
    };

    const time = defaultTimes[mealType as keyof typeof defaultTimes] || '12:00';
    return `${today}T${time}`;
  };

  const handleMealTypeChange = (mealType: string) => {
    setFormData({
      ...formData,
      meal_type: mealType,
      meal_date: formData.meal_date || suggestTimeForMealType(mealType)
    });
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
                  onClick={() => handleMealTypeChange(mealType.id)}
                  className={`h-auto p-3 flex-col gap-1 ${
                    formData.meal_type === mealType.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                  disabled={isLoading}
                >
                  <span className="text-lg">{mealType.icon}</span>
                  <span className="text-xs font-medium">{mealType.name}</span>
                  <span className="text-xs opacity-70">{mealType.timeRange}</span>
                </Button>
              ))}
            </div>
            {errors.meal_type && (
              <p className="text-sm text-red-400">{errors.meal_type}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="space-y-2">
            <Label htmlFor="meal_date" className="text-foreground">
              Data e Hora da Refeição *
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="meal_date"
                type="datetime-local"
                value={formData.meal_date}
                onChange={(e) => setFormData({ ...formData, meal_date: e.target.value })}
                max={getCurrentDateTime()}
                className={`w-full pl-10 pr-3 py-2 bg-background border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.meal_date ? 'border-red-500' : 'border-border'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.meal_date && (
              <p className="text-sm text-red-400">{errors.meal_date}</p>
            )}
          </div>

          {/* Foto da Refeição */}
          <div className="space-y-2">
            <Label className="text-foreground">Foto da Refeição (opcional)</Label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Adicione uma foto da sua refeição
                  </p>
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
            
            {errors.image && (
              <p className="text-sm text-red-400">{errors.image}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-foreground">Descrição da Refeição *</Label>
            <Textarea
              id="comments"
              placeholder="Descreva o que você comeu: ingredientes, preparo, como se sentiu..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className={`min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.comments ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {errors.comments && (
              <p className="text-sm text-red-400">{errors.comments}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Seja específico para ajudar a comunidade e acompanhar sua evolução nutricional
            </p>
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
              disabled={isLoading || !formData.meal_type || !formData.comments.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
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
