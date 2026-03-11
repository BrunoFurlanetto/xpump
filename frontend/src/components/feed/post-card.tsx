"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Camera,
  Trophy,
  Dumbbell,
  Utensils,
  Send,
  User,
  MoreHorizontal,
  Trash2,
  Flag,
  Loader2,
  Coffee,
  Pencil,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  usePostCommentsQuery,
} from "@/hooks/useFeedQuery";
import type { PostList } from "@/lib/api/feed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MediaContent from "@/app/(app)/feed/media-content";

export function PostCard({
  post,
  currentUsername,
  onLike,
  onDelete,
  onUpdate,
  isUpdating,
  isCommentSubmitting,
  onToggleComments,
  isExpanded,
  commentText,
  onCommentTextChange,
  onAddComment,
  onLikeComment,
  onDeleteComment,
}: {
  post: PostList;
  currentUsername: string;
  onLike: (postId: number) => void;
  onDelete: (postId: number) => void;
  onUpdate: (postId: number, content_text: string, files?: File[]) => void;
  isUpdating: boolean;
  isCommentSubmitting: boolean;
  onToggleComments: (postId: number) => void;
  isExpanded: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onAddComment: (postId: number) => void;
  onLikeComment: (commentId: number) => void;
  onDeleteComment: (commentId: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content_text || "");
  const [editFile, setEditFile] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { data: postWithComments } = usePostCommentsQuery(isExpanded ? post.id : 0);

  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return "agora";
    }
  };

  const isOwnPost = post.user.username === currentUsername;

  return (
    <Card className="bg-card border-border relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwnPost && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setEditText(post.content_text || "");
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem>
              <Flag className="h-4 w-4 mr-2" />
              Denunciar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardHeader className="pb-3 mt-2 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate text-xs">{post.user.full_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate text-xs">@{post.user.username}</span>
                <span>•</span>
                <span className="shrink-0 text-xs">{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Badge do tipo de conteúdo */}
        <div>{getContentTypeBadge(post.content_type)}</div>

        {/* Conteúdo de texto */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              autoFocus
            />

            {post.content_files.length > 0 && editFile.length === 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Imagens atuais</p>
                <div className="flex gap-2 flex-wrap">
                  {post.content_files.map((file) => (
                    <div key={file.id} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted group">
                      <Image src={file.file} alt="Imagem do post" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {editFile.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {editFile.map((file, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <Image src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              {post.content_type === "social" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editFileInputRef.current?.click()}
                  className="text-muted-foreground"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  foto/vídeo
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditFile([]);
                  }}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onUpdate(post.id, editText, editFile);
                    setIsEditing(false);
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  Salvar
                </Button>
              </div>
            </div>
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setEditFile(Array.from(e.target.files));
                }
              }}
            />
          </div>
        ) : (
          post.content_text && <p className="text-sm leading-relaxed">{post.content_text}</p>
        )}

        {/* Mídia */}
        {!isEditing && <MediaContent content={post.content_files} />}
        <MediaContent content={post?.workout_checkin?.proofs ?? []} />
        <MediaContent content={post?.meal?.proofs ?? []} />

        {/* Workout Data */}
        {post.workout_checkin && (
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-green-400">Treino Registrado</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">{post.workout_checkin.comments}</p>
              <div className="flex items-center gap-4 text-xs">
                <span>Duração: {post.workout_checkin.duration}</span>
                <span>Pontos: {post.workout_checkin.base_points}</span>
              </div>
            </div>
          </div>
        )}

        {/* Meal Data */}
        {post.meal && (
          <div
            className={`p-3 rounded-lg border ${
              post.meal.fasting ? "bg-amber-500/10 border-amber-500/30" : "bg-orange-500/10 border-orange-500/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {post.meal.fasting ? (
                <>
                  <Coffee className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-amber-500">Jejum Registrado</span>
                </>
              ) : (
                <>
                  <Utensils className="h-4 w-4 text-orange-400" />
                  <span className="font-semibold text-orange-400">Refeição Registrada</span>
                </>
              )}
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">
                {post.meal.fasting ? `Jejum ${post.meal.meal_type_name || ""}` : post.meal.meal_type_name}
              </p>
              {post.meal.comments && <p className="text-muted-foreground">{post.meal.comments}</p>}
              <div className="flex items-center gap-4 text-xs">
                <span>Horário: {new Date(post.meal.meal_time).toLocaleTimeString("pt-BR")}</span>
                <span>Pontos: {post.meal.base_points}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              disabled={isUpdating}
              className={`gap-2 ${post.is_liked_by_user ? "text-red-500" : "text-muted-foreground"}`}
            >
              <Heart className={`h-4 w-4 ${post.is_liked_by_user ? "fill-current" : ""}`} />
              <span>{post.likes_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleComments(post.id)}
              disabled={isUpdating}
              className="gap-2 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t border-border">
            {/* Add Comment */}
            <div className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={commentText}
                  onChange={(e) => onCommentTextChange(e.target.value)}
                  className="min-h-[60px] text-sm"
                  disabled={isCommentSubmitting}
                />
                <Button
                  size="sm"
                  onClick={() => onAddComment(post.id)}
                  disabled={!commentText.trim() || isCommentSubmitting}
                >
                  {isCommentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Comments List */}
            {postWithComments?.results.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2 pl-4">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-muted text-xs">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user.full_name}</span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLikeComment(comment.id)}
                      className={`h-6 gap-1 text-xs ${
                        comment.is_liked_by_user ? "text-red-500" : "text-muted-foreground"
                      }`}
                    >
                      <Heart className={`h-3 w-3 ${comment.is_liked_by_user ? "fill-current" : ""}`} />
                      {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                    </Button>
                    {comment.user.username === currentUsername && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteComment(comment.id)}
                        className="h-6 text-xs text-destructive"
                      >
                        Deletar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function getContentTypeBadge(type: string) {
  const badges = {
    workout: { label: "Treino", icon: Dumbbell, color: "bg-green-500/10 text-green-500 border-green-500/20" },
    meal: { label: "Refeição", icon: Utensils, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    achievement: { label: "Conquista", icon: Trophy, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    social: { label: "Social", icon: MessageCircle, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  };
  const badge = badges[type as keyof typeof badges];
  if (!badge) return null;

  const Icon = badge.icon;
  return (
    <Badge className={`${badge.color} border`}>
      <Icon className="h-3 w-3 mr-1" />
      {badge.label}
    </Badge>
  );
}
