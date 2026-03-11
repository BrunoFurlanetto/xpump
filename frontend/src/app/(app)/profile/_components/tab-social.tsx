"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  useFeedQuery,
  useTogglePostLike,
  useDeletePost,
  useUpdatePost,
  useAddComment,
  useToggleCommentLike,
  useDeleteComment,
} from "@/hooks/useFeedQuery";
import { PostCard } from "@/components/feed/post-card";
import { useUserAuth } from "@/context/userAuthContext";

interface TabSocialProps {
  userId: number;
}

export function TabSocial({ userId }: TabSocialProps) {
  const { user } = useUserAuth();
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedQuery(undefined, "social", userId);

  const togglePostLike = useTogglePostLike();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  const addComment = useAddComment();
  const toggleCommentLike = useToggleCommentLike();
  const deleteComment = useDeleteComment();

  const posts = data?.pages.flatMap((page) => page.results) ?? [];

  const toggleComments = (postId: number) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleAddComment = async (postId: number) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    await addComment.mutateAsync({ postId, text });
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("Tem certeza que deseja deletar este post?")) {
      deletePost.mutate(postId);
    }
  };

  const handleUpdatePost = (postId: number, content_text: string, files?: File[]) => {
    updatePost.mutate({
      postId,
      data: { content_text, files: files && files.length > 0 ? files : undefined },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Nenhum post ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUsername={user?.username ?? ""}
          onLike={togglePostLike.mutate}
          onDelete={handleDeletePost}
          onUpdate={handleUpdatePost}
          isUpdating={updatePost.isPending && updatePost.variables?.postId === post.id}
          isCommentSubmitting={addComment.isPending && addComment.variables?.postId === post.id}
          onToggleComments={toggleComments}
          isExpanded={expandedPosts.has(post.id)}
          commentText={commentTexts[post.id] ?? ""}
          onCommentTextChange={(text) => setCommentTexts((prev) => ({ ...prev, [post.id]: text }))}
          onAddComment={handleAddComment}
          onLikeComment={toggleCommentLike.mutate}
          onDeleteComment={deleteComment.mutate}
        />
      ))}

      {hasNextPage && (
        <div className="flex justify-center py-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
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
    </div>
  );
}
