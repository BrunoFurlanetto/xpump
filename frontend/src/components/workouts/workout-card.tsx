"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, MessageSquare, Trophy, MoreVertical, Edit3, Trash2, Save, X } from "lucide-react";
import { WorkoutCheckin } from "@/lib/api/workouts";

interface WorkoutCardProps {
  workout: WorkoutCheckin;
  onUpdateComments: (id: number, comments: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  formatDate: (date: string) => string;
  formatDuration: (duration: string) => string;
}

export function WorkoutCard({ workout, onUpdateComments, onDelete, formatDate, formatDuration }: WorkoutCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedComments, setEditedComments] = useState(workout.comments);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveComments = async () => {
    try {
      setIsUpdating(true);
      await onUpdateComments(workout.id, editedComments);
      setIsEditing(false);
    } catch {
      setEditedComments(workout.comments); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedComments(workout.comments);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(workout.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 2.0) return "text-yellow-400";
    if (multiplier >= 1.75) return "text-orange-400";
    if (multiplier >= 1.5) return "text-blue-400";
    if (multiplier >= 1.25) return "text-green-400";
    return "text-gray-400";
  };

  const getMultiplierBadge = (multiplier: number) => {
    if (multiplier >= 2.0) return "Lendário";
    if (multiplier >= 1.75) return "Excepcional";
    if (multiplier >= 1.5) return "Excelente";
    if (multiplier >= 1.25) return "Ótimo";
    return "Bom";
  };

  return (
    <>
      <Card className="bg-card border-border hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">{formatDate(workout.workout_date)}</h3>
                <Badge variant="outline" className="text-xs">
                  {formatDuration(workout.duration)}
                </Badge>
                {workout.multiplier > 1 && (
                  <Badge variant="secondary" className={`text-xs ${getMultiplierColor(workout.multiplier)}`}>
                    {getMultiplierBadge(workout.multiplier)} ({workout.multiplier}x)
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {workout.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{workout.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  <span>{workout.base_points.toFixed(1)} pontos</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-popover-foreground">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar Comentário
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-400 focus:text-red-400">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Treino
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedComments}
                onChange={(e) => setEditedComments(e.target.value)}
                placeholder="Adicione um comentário sobre seu treino..."
                className="min-h-[80px] bg-background border-border text-foreground"
                disabled={isUpdating}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveComments}
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {isUpdating ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="border-border text-foreground hover:bg-muted"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            workout.comments && (
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{workout.comments}</p>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O treino será removido permanentemente e os pontos associados serão
              subtraídos do seu total.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
