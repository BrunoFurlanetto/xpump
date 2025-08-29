"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  Clock, 
  Trophy, 
  MoreVertical,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { MealLog, MealType } from '@/hooks/useMeals';

interface MealCardProps {
  meal: MealLog;
  mealType: MealType;
  onUpdateComments: (id: number, comments: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  formatDate: (date: string) => string;
}

export function MealCard({ 
  meal, 
  mealType,
  onUpdateComments, 
  onDelete, 
  formatDate 
}: MealCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedComments, setEditedComments] = useState(meal.comments);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveComments = async () => {
    try {
      setIsUpdating(true);
      await onUpdateComments(meal.id, editedComments);
      setIsEditing(false);
    } catch (error) {
      setEditedComments(meal.comments); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedComments(meal.comments);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(meal.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className="bg-card border-border hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <span className="text-lg">{mealType.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{mealType.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    {meal.points} pts
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(meal.meal_date)}</span>
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
                <DropdownMenuItem 
                  onClick={() => setIsEditing(true)}
                  className="text-popover-foreground"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar Descrição
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Refeição
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedComments}
                onChange={(e) => setEditedComments(e.target.value)}
                placeholder="Descreva sua refeição..."
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
                  {isUpdating ? 'Salvando...' : 'Salvar'}
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
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{meal.comments}</p>
            </div>
          )}

          {meal.photo && (
            <div className="mt-3">
              <img
                src={meal.photo}
                alt="Foto da refeição"
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir refeição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A refeição será removida permanentemente 
              e os pontos associados serão subtraídos do seu total.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
