"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useCreateAdjustment } from "@/hooks/useGamificationQuery";
import type { CreateAdjustmentData } from "@/lib/api/gamification";

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-seleciona o tipo de ajuste */
  defaultType?: "bonus" | "penalty";
  /** Alvo do ajuste (obrigatório, inferido do contexto) */
  targetType: "meal" | "workout_checkin";
  targetId: number;
  /** Contexto exibido no dialog (ex: nome do usuário, tipo do post) */
  contextLabel?: string;
}

const TARGET_LABELS: Record<string, string> = {
  workout_checkin: "Treino",
  meal: "Refeição",
};

export function AdjustmentDialog({
  open,
  onOpenChange,
  defaultType,
  targetType,
  targetId,
  contextLabel,
}: AdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<"bonus" | "penalty">(defaultType || "penalty");
  const [score, setScore] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (defaultType) setAdjustmentType(defaultType);
  }, [defaultType]);

  const createAdjustment = useCreateAdjustment();

  const resetForm = () => {
    setAdjustmentType(defaultType || "penalty");
    setScore("");
    setReason("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    const scoreNum = parseFloat(score);
    if (!scoreNum || scoreNum < 0.01) return;

    const data: CreateAdjustmentData = {
      adjustment_type: adjustmentType,
      score: scoreNum,
      target_type: targetType,
      target_id: targetId,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    };

    createAdjustment.mutate(data, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  const isValid = parseFloat(score) >= 0.01;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {adjustmentType === "bonus" ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            {adjustmentType === "bonus" ? "Aplicar Bônus" : "Aplicar Penalidade"}
          </DialogTitle>
          <DialogDescription>
            {contextLabel || `${TARGET_LABELS[targetType]} #${targetId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo de ajuste */}
          <div className="space-y-2">
            <Label>Tipo de ajuste</Label>
            <Select
              value={adjustmentType}
              onValueChange={(v) => setAdjustmentType(v as "bonus" | "penalty")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bonus">Bônus (adicionar pontos)</SelectItem>
                <SelectItem value="penalty">Penalidade (remover pontos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pontuação */}
          <div className="space-y-2">
            <Label htmlFor="adj-score">Pontuação</Label>
            <Input
              id="adj-score"
              type="number"
              min="0.01"
              step="0.01"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Ex: 5.0"
            />
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="adj-reason">Motivo (opcional)</Label>
            <Textarea
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique o motivo do ajuste..."
              className="min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={createAdjustment.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createAdjustment.isPending}
            variant={adjustmentType === "penalty" ? "destructive" : "default"}
          >
            {createAdjustment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : adjustmentType === "bonus" ? (
              "Aplicar bônus"
            ) : (
              "Aplicar penalidade"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
