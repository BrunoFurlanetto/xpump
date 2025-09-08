"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Dumbbell, 
  MapPin, 
  MessageSquare,
  Camera,
  Upload,
  X
} from 'lucide-react';
import { CreateWorkoutData } from '@/hooks/useWorkouts';

interface WorkoutCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkoutData) => Promise<void>;
  isLoading?: boolean;
}

export function WorkoutCheckinModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: WorkoutCheckinModalProps) {
  const [formData, setFormData] = useState({
    location: '',
    comments: '',
    workout_date: '',
    duration: '',
    hours: '1',
    minutes: '0'
  });
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.workout_date) {
      newErrors.workout_date = 'Data e hora do treino são obrigatórias';
    }

    const hours = parseInt(formData.hours);
    const minutes = parseInt(formData.minutes);

    if (isNaN(hours) || hours < 0 || hours > 23) {
      newErrors.hours = 'Horas devem estar entre 0 e 23';
    }

    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      newErrors.minutes = 'Minutos devem estar entre 0 e 59';
    }

    if (hours === 0 && minutes === 0) {
      newErrors.duration = 'Duração deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const duration = `${formData.hours.padStart(2, '0')}:${formData.minutes.padStart(2, '0')}:00`;
      
      const submitData: CreateWorkoutData = {
        location: formData.location || undefined,
        comments: formData.comments,
        workout_date: formData.workout_date,
        duration,
        proof_image: proofImage || undefined
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('Erro ao submeter treino:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      location: '',
      comments: '',
      workout_date: '',
      duration: '',
      hours: '1',
      minutes: '0'
    });
    setProofImage(null);
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

      setProofImage(file);
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
    setProofImage(null);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Dumbbell className="h-5 w-5 text-primary" />
            Registrar Treino
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Registre seu treino e ganhe pontos pela sua dedicação!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data e Hora */}
          <div className="space-y-2">
            <Label htmlFor="workout_date" className="text-foreground">
              Data e Hora do Treino *
            </Label>
            <Input
              id="workout_date"
              type="datetime-local"
              value={formData.workout_date}
              onChange={(e) => setFormData({ ...formData, workout_date: e.target.value })}
              max={getCurrentDateTime()}
              className={`bg-background border-border text-foreground ${errors.workout_date ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.workout_date && (
              <p className="text-sm text-red-400">{errors.workout_date}</p>
            )}
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label className="text-foreground">Duração do Treino *</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="hours" className="text-xs text-muted-foreground">Horas</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className={`bg-background border-border text-foreground ${errors.hours ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="minutes" className="text-xs text-muted-foreground">Minutos</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                  className={`bg-background border-border text-foreground ${errors.minutes ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
            </div>
            {(errors.hours || errors.minutes || errors.duration) && (
              <p className="text-sm text-red-400">
                {errors.hours || errors.minutes || errors.duration}
              </p>
            )}
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">Local (opcional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Ex: Academia Central, Casa, Parque..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Prova do Treino */}
          <div className="space-y-2">
            <Label className="text-foreground">Prova do Treino (opcional)</Label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Adicione uma foto como prova do seu treino
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
                  alt="Prova do treino"
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

          {/* Comentários */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-foreground">Comentários</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="comments"
                placeholder="Como foi seu treino? Conte para a comunidade..."
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="pl-10 min-h-[80px] bg-background border-border text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Info sobre pontos */}
          <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-foreground">💡 Como funciona a pontuação?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Pontos base calculados pela duração do treino</li>
              <li>• Multiplicador baseado na sua sequência de treinos</li>
              <li>• Quanto mais consistente, mais pontos você ganha!</li>
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
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Treino
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
