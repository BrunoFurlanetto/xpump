// Gamification API

export interface AdjustmentEntry {
  score: number;
  created_at: string;
  created_by: { id: number; fullname: string };
  reason?: string;
}

export interface CreateAdjustmentData {
  adjustment_type: "bonus" | "penalty";
  score: number;
  reason?: string;
  target_type: "meal" | "workout_checkin";
  target_id: number;
}

export interface AdjustmentResponse {
  id: number;
  adjustment_type: "bonus" | "penalty";
  score: number;
  reason?: string;
  created_at: string;
  created_by_id: number;
  target_type: "meal" | "workout_checkin";
  target_id: number;
}

export class GamificationAPI {
  /**
   * Cria um ajuste de gamificação (bônus ou penalidade)
   */
  static async createAdjustment(data: CreateAdjustmentData): Promise<AdjustmentResponse> {
    const response = await fetch("/api/v1/gamification/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao criar ajuste" }));
      throw new Error(error.detail || "Erro ao criar ajuste");
    }

    return response.json();
  }

  /**
   * Lista ajustes de gamificação com filtros opcionais
   */
  static async getAdjustments(filters?: {
    adjustment_type?: "bonus" | "penalty";
    user_id?: number;
    target_type?: "meal" | "workout_checkin";
    target_id?: number;
  }): Promise<AdjustmentResponse[]> {
    const params = new URLSearchParams();
    if (filters?.adjustment_type) params.append("adjustment_type", filters.adjustment_type);
    if (filters?.user_id) params.append("user_id", filters.user_id.toString());
    if (filters?.target_type) params.append("target_type", filters.target_type);
    if (filters?.target_id) params.append("target_id", filters.target_id.toString());

    const response = await fetch(`/api/v1/gamification/adjustments?${params}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar ajustes");
    }

    return response.json();
  }
}
