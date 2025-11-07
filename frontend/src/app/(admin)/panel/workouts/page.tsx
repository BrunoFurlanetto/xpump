"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminAPI, AdminWorkoutDetail } from "@/lib/api/admin";
import { Calendar, Clock, MapPin, Eye, Check, X, Filter } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<AdminWorkoutDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<AdminWorkoutDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const checkSelectedGroup = () => {
      const savedGroupId = localStorage.getItem("adminSelectedGroupId");
      if (savedGroupId) {
        setSelectedGroupId(parseInt(savedGroupId));
      }
    };

    checkSelectedGroup();
    const interval = setInterval(checkSelectedGroup, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadWorkouts();
    }
  }, [selectedGroupId, statusFilter]);

  const loadWorkouts = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      const filters = statusFilter !== "all" ? { status: parseInt(statusFilter) } : undefined;
      const data = await AdminAPI.getGroupWorkouts(selectedGroupId, filters);
      setWorkouts(data);
    } catch (error) {
      console.error("Erro ao carregar treinos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (workoutId: number, status: number) => {
    try {
      await AdminAPI.updateWorkoutValidation(workoutId, { validation_status: status });
      setSelectedWorkout(null);
      loadWorkouts();
    } catch (error) {
      console.error("Erro ao validar treino:", error);
    }
  };

  if (!selectedGroupId) {
    return null;
  }

  if (loading) {
    return <WorkoutsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Treinos</h1>
          <p className="text-muted-foreground">
            Visualize e modere os check-ins de treino
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Aprovados</SelectItem>
              <SelectItem value="0">Pendentes</SelectItem>
              <SelectItem value="-1">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Treinos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workouts.filter((w) => w.validation_status === 1).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {workouts.filter((w) => w.validation_status === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workouts List */}
      <Card>
        <CardHeader>
          <CardTitle>Treinos Registrados</CardTitle>
          <CardDescription>
            {workouts.length} treino(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum treino encontrado
              </p>
            ) : (
              workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {workout.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{workout.username}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(workout.workout_date).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.duration}
                        </span>
                        {workout.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {workout.location}
                          </span>
                        )}
                      </div>
                      {workout.comments && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {workout.comments}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        workout.validation_status === 1
                          ? "default"
                          : workout.validation_status === 0
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {workout.validation_status_name}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkout(workout)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workout Detail Dialog */}
      <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedWorkout && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Treino</DialogTitle>
                <DialogDescription>
                  Treino de {selectedWorkout.username}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedWorkout.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedWorkout.username}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {selectedWorkout.user_id}
                    </p>
                  </div>
                </div>

                {/* Workout Info */}
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data do Treino</span>
                    <span className="font-medium">
                      {new Date(selectedWorkout.workout_date).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Duração</span>
                    <span className="font-medium">{selectedWorkout.duration}</span>
                  </div>
                  {selectedWorkout.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Local</span>
                      <span className="font-medium">{selectedWorkout.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pontos Base</span>
                    <span className="font-medium">{selectedWorkout.base_points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Multiplicador</span>
                    <span className="font-medium">{selectedWorkout.multiplier}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-bold text-lg">
                      {(selectedWorkout.base_points * selectedWorkout.multiplier).toFixed(0)} pts
                    </span>
                  </div>
                </div>

                {/* Comments */}
                {selectedWorkout.comments && (
                  <div>
                    <p className="text-sm font-medium mb-2">Comentários</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {selectedWorkout.comments}
                    </p>
                  </div>
                )}

                {/* Proofs */}
                {selectedWorkout.proofs && selectedWorkout.proofs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Comprovantes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedWorkout.proofs.map((proof) => (
                        <div
                          key={proof.id}
                          className="relative aspect-video rounded-md overflow-hidden border"
                        >
                          <Image
                            src={proof.file}
                            alt="Comprovante"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation Actions */}
                {selectedWorkout.validation_status === 0 && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      variant="default"
                      onClick={() => handleValidation(selectedWorkout.id, 1)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleValidation(selectedWorkout.id, -1)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex justify-center pt-2">
                  <Badge
                    variant={
                      selectedWorkout.validation_status === 1
                        ? "default"
                        : selectedWorkout.validation_status === 0
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    Status: {selectedWorkout.validation_status_name}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkoutsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b pb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-48" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
