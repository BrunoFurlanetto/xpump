"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useUserAuth } from "@/context/userAuthContext";
import {
  usePostQuery,
  useDeletePost,
  useUpdatePost,
  useTogglePostLike,
  useAddComment,
  useToggleCommentLike,
  useDeleteComment,
} from "@/hooks/useFeedQuery";
import { PostCard } from "@/components/feed/post-card";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);
  const { user } = useUserAuth();

  const [commentText, setCommentText] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: post, isLoading, isError } = usePostQuery(postId);

  const deletePostMutation = useDeletePost();
  const updatePostMutation = useUpdatePost();
  const togglePostLikeMutation = useTogglePostLike();
  const addCommentMutation = useAddComment();
  const toggleCommentLikeMutation = useToggleCommentLike();
  const deleteCommentMutation = useDeleteComment();

  const handleLikePost = (postId: number) => {
    togglePostLikeMutation.mutate(postId);
  };

  const handleAddComment = async (postId: number) => {
    if (!commentText.trim()) return;
    await addCommentMutation.mutateAsync({ postId, text: commentText });
    setCommentText("");
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("Tem certeza que deseja deletar este post?")) {
      deletePostMutation.mutate(postId, {
        onSuccess: () => router.back(),
      });
    }
  };

  const handleUpdatePost = (postId: number, content_text: string, files?: File[]) => {
    updatePostMutation.mutate({
      postId,
      data: {
        content_text,
        files: files && files.length > 0 ? files : undefined,
      },
    });
  };

  const toggleComments = () => {
    setIsExpanded((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Post não encontrado</h2>
            <p className="text-muted-foreground">
              Este post pode ter sido removido ou não existe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <PostCard
        post={post}
        currentUsername={user?.username ?? ""}
        onLike={handleLikePost}
        onDelete={handleDeletePost}
        onUpdate={handleUpdatePost}
        isUpdating={updatePostMutation.isPending}
        isCommentSubmitting={addCommentMutation.isPending}
        onToggleComments={toggleComments}
        isExpanded={isExpanded}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onAddComment={handleAddComment}
        onLikeComment={toggleCommentLikeMutation.mutate}
        onDeleteComment={deleteCommentMutation.mutate}
      />
    </div>
  );
}
