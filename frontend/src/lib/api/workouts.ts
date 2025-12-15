export interface WorkoutCheckin {
  id: number;
  user: number;
  location?: string;
  comments: string;
  workout_date: string;
  duration: string; // formato HH:MM:SS
  validation_status: number;
  base_points: number;
  multiplier: number;
  proofs?: Array<{
    id: number;
    file: string;
  }>;
  current_streak: number;
  longest_streak: number;
}

export interface CreateWorkoutData {
  location?: string;
  comments: string;
  workout_date: string;
  duration: string; // formato HH:MM:SS
  proof_files?: File[];
  share_to_feed?: boolean;
}

export interface WorkoutStats {
  total_workouts: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  this_week_workouts: number;
  this_month_workouts: number;
  avg_duration_minutes: number;
}

export class WorkoutsAPI {
  static async getWorkouts(userId: number): Promise<WorkoutCheckin[]> {
    const response = await fetch(`/api/workouts?userId=${userId}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar treinos");
    }
    return response.json();
  }

  static async createWorkout(data: CreateWorkoutData): Promise<WorkoutCheckin> {
    const formData = new FormData();

    formData.append("comments", data.comments);
    formData.append("workout_date", data.workout_date);
    formData.append("duration", data.duration);

    if (data.location) {
      formData.append("location", data.location);
    }

    if (data.proof_files && data.proof_files.length > 0) {
      data.proof_files.forEach((file) => {
        formData.append("proof_files", file);
      });
    }

    console.log("🚀 Sending workout data to API");

    const response = await fetch(`/api/workouts`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || "Error creating workout" };
      }

      throw new Error(error.error || error.detail || JSON.stringify(error));
    }

    return response.json();
  }

  static async updateWorkout(id: number, comments: string): Promise<WorkoutCheckin> {
    const response = await fetch(`/api/workouts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comments }),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar treino");
    }

    return response.json();
  }

  static async deleteWorkout(id: number): Promise<void> {
    const response = await fetch(`/api/workouts/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar treino");
    }
  }

  static calculateStats(workouts: WorkoutCheckin[]): WorkoutStats {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Domingo
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekWorkouts = workouts.filter((w) => new Date(w.workout_date) >= weekStart);

    const thisMonthWorkouts = workouts.filter((w) => new Date(w.workout_date) >= monthStart);

    const totalPoints = workouts.reduce((sum, w) => sum + w.base_points * w.multiplier, 0);

    const totalMinutes = workouts.reduce((sum, w) => {
      const [hours, minutes] = w.duration.split(":").map(Number);
      return sum + hours * 60 + minutes;
    }, 0);

    const avgDuration = workouts.length > 0 ? Math.round(totalMinutes / workouts.length) : 0;

    return {
      total_workouts: workouts.length,
      total_points: totalPoints,
      current_streak: workouts[0]?.current_streak || 0,
      longest_streak: workouts[0]?.longest_streak || 0,
      this_week_workouts: thisWeekWorkouts.length,
      this_month_workouts: thisMonthWorkouts.length,
      avg_duration_minutes: avgDuration,
    };
  }
}
