"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GamificationAPI, CreateAdjustmentData, AdjustmentResponse } from "@/lib/api/gamification";
import { toast } from "sonner";

export const gamificationKeys = {
  all: ["gamification"] as const,
  adjustments: (filters?: Record<string, unknown>) => [...gamificationKeys.all, "adjustments", filters] as const,
};

/**
 * Hook para criar um ajuste de gamificação (bônus ou penalidade)
 */
export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdjustmentData) => GamificationAPI.createAdjustment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
      const label = variables.adjustment_type === "bonus" ? "Bônus" : "Penalidade";
      toast.success(`${label} aplicado(a) com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao aplicar ajuste");
    },
  });
}

/**
 * Hook para listar ajustes de gamificação
 */
export function useAdjustments(filters?: {
  adjustment_type?: "bonus" | "penalty";
  user_id?: number;
  target_type?: "meal" | "workout_checkin";
  target_id?: number;
}) {
  return useQuery<AdjustmentResponse[]>({
    queryKey: gamificationKeys.adjustments(filters as Record<string, unknown>),
    queryFn: () => GamificationAPI.getAdjustments(filters),
    staleTime: 1000 * 60 * 2,
  });
}
