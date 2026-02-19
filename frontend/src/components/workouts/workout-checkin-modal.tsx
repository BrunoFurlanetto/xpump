"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Dumbbell, MapPin, MessageSquare, Camera, Upload, X, Share2 } from "lucide-react";
import { CreateWorkoutData } from "@/lib/api/workouts";

interface WorkoutCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkoutData) => Promise<void>;
  isLoading?: boolean;
}

export function WorkoutCheckinModal({ isOpen, onClose, onSubmit, isLoading = false }: WorkoutCheckinModalProps) {
  // Função para obter data/hora atual no formato correto
  function getCurrentDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  const [formData, setFormData] = useState({
    location: "",
    comments: "",
    workout_date: getCurrentDateTime(), // Inicializa com horário atual
    duration: "",
    hours: "1",
    minutes: "0",
  });
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shareToFeed, setShareToFeed] = useState(true); // Padrão: compartilhar
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.workout_date) {
      newErrors.workout_date = "Data e hora do treino são obrigatórias";
    }

    const hours = parseInt(formData.hours);
    const minutes = parseInt(formData.minutes);

    if (isNaN(hours) || hours < 0 || hours > 23) {
      newErrors.hours = "Horas devem estar entre 0 e 23";
    }

    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      newErrors.minutes = "Minutos devem estar entre 0 e 59";
    }

    if (hours === 0 && minutes === 0) {
      newErrors.duration = "Duração deve ser maior que 0";
    }

    if (!proofImage) {
      newErrors.image = "Foto ou vídeo do treino é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const duration = `${formData.hours.padStart(2, "0")}:${formData.minutes.padStart(2, "0")}:00`;

      const submitData: CreateWorkoutData = {
        location: formData.location || undefined,
        comments: formData.comments,
        workout_date: formData.workout_date,
        duration,
        proof_files: proofImage ? [proofImage] : undefined,
        share_to_feed: shareToFeed,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error("Erro ao submeter treino:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      location: "",
      comments: "",
      workout_date: getCurrentDateTime(), // Reset para horário atual
      duration: "",
      hours: "1",
      minutes: "0",
    });
    setProofImage(null);
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
      fileInputRef.current.value = "";
    }
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
          {/* Data e Hora (readonly - horário atual) */}
          <div className="space-y-2 hidden">
            <Label htmlFor="workout_date" className="text-foreground">
              Horário do Treino
            </Label>
            <Input
              id="workout_date"
              type="datetime-local"
              value={formData.workout_date}
              readOnly
              className="bg-muted/50 border-border text-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">O treino será registrado com o horário atual</p>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label className="text-foreground">Duração do Treino *</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="hours" className="text-xs text-muted-foreground">
                  Horas
                </Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className={`bg-background border-border text-foreground ${errors.hours ? "border-red-500" : ""}`}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="minutes" className="text-xs text-muted-foreground">
                  Minutos
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                  className={`bg-background border-border text-foreground ${errors.minutes ? "border-red-500" : ""}`}
                  disabled={isLoading}
                />
              </div>
            </div>
            {(errors.hours || errors.minutes || errors.duration) && (
              <p className="text-sm text-red-400">{errors.hours || errors.minutes || errors.duration}</p>
            )}
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">
              Local (opcional)
            </Label>
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
            <Label className="text-foreground">Prova do Treino *</Label>

            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-4 ${errors.image ? "border-red-500" : "border-border"}`}
              >
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Adicione uma foto ou vídeo como prova do seu treino
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
                    Escolher Foto/Vídeo
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
              accept="image/*,video/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading}
            />

            {errors.image && <p className="text-sm text-red-400">{errors.image}</p>}
          </div>

          {/* Comentários */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-foreground">
              Comentários
            </Label>
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

          {/* Compartilhar no feed */}
          <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg hidden">
            <Checkbox
              id="shareToFeed"
              checked={shareToFeed}
              onCheckedChange={(checked) => setShareToFeed(checked === true)}
            />
            <div className="flex-1">
              <label
                htmlFor="shareToFeed"
                className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
              >
                <Share2 className="h-4 w-4 text-primary" />
                Compartilhar no feed
              </label>
              <p className="text-xs text-muted-foreground">Mostre seu treino, motive outros membros!</p>
            </div>
          </div>

          {/* Info sobre pontos */}
          <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-foreground">💡 Como funcionam os pontos?</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                <span className="text-foreground font-medium">Treinos de 1h:</span> Valem 2 XP
              </li>
              <li>
                <span className="text-foreground font-medium">Treinos com menos de 1h:</span> Valem 1 XP
              </li>
              <li>
                <span className="text-foreground font-medium">Treinos com mais de 1h:</span> Valem 3 XP
              </li>
              <li>
                <span className="text-foreground font-medium">Treinos de 2h ou mais:</span> Valem 4 XP
              </li>
              <li>
                <span className="text-foreground font-medium">Limite diário:</span> 4 XP
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
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
