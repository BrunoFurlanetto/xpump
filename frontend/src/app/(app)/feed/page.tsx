"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Send, Loader2 } from "lucide-react";
import { useUserAuth } from "@/context/userAuthContext";
import Image from "next/image";
import {
  useFeedQuery,
  useCreatePost,
  useDeletePost,
  useUpdatePost,
  useTogglePostLike,
  useAddComment,
  useToggleCommentLike,
  useDeleteComment,
} from "@/hooks/useFeedQuery";
import { PostCard } from "@/components/feed/post-card";

export default function FeedPage() {
  const { user } = useUserAuth();
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeedQuery();
  console.log(data);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Mutations
  const createPostMutation = useCreatePost();
  const deletePostMutation = useDeletePost();
  const updatePostMutation = useUpdatePost();
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

  const handleUpdatePost = (postId: number, content_text: string, files?: File[]) => {
    updatePostMutation.mutate({
      postId, data: {
        content_text,
        files: files && files.length > 0 ? files : undefined,
      }
    });
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
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Compartilhe algo com a comunidade..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={createPostMutation.isPending}
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
                  disabled={createPostMutation.isPending}
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
            currentUsername={user?.username ?? ""}
            onLike={handleLikePost}
            onDelete={handleDeletePost}
            onUpdate={handleUpdatePost}
            isUpdating={updatePostMutation.isPending && updatePostMutation.variables?.postId === post.id}
            isCommentSubmitting={addCommentMutation.isPending && addCommentMutation.variables?.postId === post.id}
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

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando mais posts...</span>
            </div>
          )}
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

