"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  MessageCircle,
  Share2,
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
} from "lucide-react";
import { useUserAuth } from "@/context/userAuthContext";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  useFeedQuery,
  useCreatePost,
  useDeletePost,
  useTogglePostLike,
  useAddComment,
  useToggleCommentLike,
  useDeleteComment,
  usePostCommentsQuery,
} from "@/hooks/useFeedQuery";
import type { PostList } from "@/lib/api/feed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FeedPage() {
  const { user } = useUserAuth();
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedQuery();

  // Mutations
  const createPostMutation = useCreatePost();
  const deletePostMutation = useDeletePost();
  const togglePostLikeMutation = useTogglePostLike();
  const addCommentMutation = useAddComment();
  const toggleCommentLikeMutation = useToggleCommentLike();
  const deleteCommentMutation = useDeleteComment();

  const posts = data?.pages.flatMap((page) => page.results) || [];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return;

    await createPostMutation.mutateAsync({
      content_type: "social",
      content_text: newPostContent,
      files: selectedImages,
      visibility: "global",
      allow_comments: true,
    });

    setNewPostContent("");
    setSelectedImages([]);
  };

  const handleLikePost = (postId: number) => {
    togglePostLikeMutation.mutate(postId);
  };

  const handleAddComment = async (postId: number) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;

    await addCommentMutation.mutateAsync({ postId, text });
    setCommentTexts({ ...commentTexts, [postId]: "" });
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("Tem certeza que deseja deletar este post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const toggleComments = (postId: number) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Feed 📱</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Acompanhe as atividades da comunidade</p>
      </div>

      {/* Create Post */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Compartilhe algo com a comunidade..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              {selectedImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Foto/Vídeo
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending || (!newPostContent.trim() && selectedImages.length === 0)}
                  size="sm"
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id ? parseInt(user.id) : 0}
            onLike={handleLikePost}
            onDelete={handleDeletePost}
            onToggleComments={toggleComments}
            isExpanded={expandedPosts.has(post.id)}
            commentText={commentTexts[post.id] || ""}
            onCommentTextChange={(text) => setCommentTexts({ ...commentTexts, [post.id]: text })}
            onAddComment={handleAddComment}
            onLikeComment={toggleCommentLikeMutation.mutate}
            onDeleteComment={deleteCommentMutation.mutate}
          />
        ))}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline">
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}

      {posts.length === 0 && !isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro a compartilhar algo!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Post Card Component
function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
  onToggleComments,
  isExpanded,
  commentText,
  onCommentTextChange,
  onAddComment,
  onLikeComment,
  onDeleteComment,
}: {
  post: PostList;
  currentUserId: number;
  onLike: (postId: number) => void;
  onDelete: (postId: number) => void;
  onToggleComments: (postId: number) => void;
  isExpanded: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onAddComment: (postId: number) => void;
  onLikeComment: (commentId: number) => void;
  onDeleteComment: (commentId: number) => void;
}) {
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

  const isOwnPost = post.user.id === currentUserId;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{post.user.full_name}</p>
                <Badge variant="outline" className="h-5 text-xs shrink-0">
                  Nível {post.user.profile_level}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">@{post.user.username}</span>
                <span>•</span>
                <span className="shrink-0">{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost && (
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                Denunciar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Badge do tipo de conteúdo */}
        <div>{getContentTypeBadge(post.content_type)}</div>

        {/* Conteúdo de texto */}
        {post.content_text && <p className="text-sm leading-relaxed">{post.content_text}</p>}

        {/* Mídia */}
        {post.content_files.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {post.content_files.map((file) => {
              const isVideo = file.file.endsWith(".mp4") || file.file.endsWith(".webm") || file.file.endsWith(".mov");

              if (isVideo) {
                return (
                  <div key={file.id} className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                    <video controls className="w-full h-full object-cover">
                      <source src={file.file} type="video/mp4" />
                      Seu navegador não suporta vídeos.
                    </video>
                  </div>
                );
              } else {
                return (
                  <div key={file.id} className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                    <Image src={file.file} alt="Post media" fill className="object-cover" />
                  </div>
                );
              }
            })}
          </div>
        )}

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
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-orange-400" />
              <span className="font-semibold text-orange-400">Refeição Registrada</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">{post.meal.meal_type_name}</p>
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
              className={`gap-2 ${post.is_liked_by_user ? "text-red-500" : "text-muted-foreground"}`}
            >
              <Heart className={`h-4 w-4 ${post.is_liked_by_user ? "fill-current" : ""}`} />
              <span>{post.likes_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleComments(post.id)}
              className="gap-2 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
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
                />
                <Button size="sm" onClick={() => onAddComment(post.id)} disabled={!commentText.trim()}>
                  <Send className="h-4 w-4" />
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
                    {comment.user.id === currentUserId && (
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

function getContentTypeBadge(type: string) {
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
