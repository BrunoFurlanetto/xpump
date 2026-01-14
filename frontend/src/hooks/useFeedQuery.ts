"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { FeedAPI, CreatePostData, CreateReportData } from "@/lib/api/feed";
import { toast } from "sonner";

// Query Keys
export const feedKeys = {
  all: ["feed"] as const,
  lists: () => [...feedKeys.all, "list"] as const,
  list: (filters: {
    visibility?: "global" | "group" | "private";
    contentType?: "workout" | "meal" | "social" | "achievement";
    userId?: number;
  }) => [...feedKeys.lists(), filters] as const,
  details: () => [...feedKeys.all, "detail"] as const,
  detail: (id: number) => [...feedKeys.details(), id] as const,
  comments: (postId: number) => [...feedKeys.all, "comments", postId] as const,
  userPosts: (userId: number) => [...feedKeys.all, "userPosts", userId] as const,
};

// Hook para buscar posts com paginação infinita
export function useFeedQuery(
  visibility?: "global" | "group" | "private",
  contentType?: "workout" | "meal" | "social" | "achievement",
  userId?: number
) {
  return useInfiniteQuery({
    queryKey: feedKeys.list({ visibility, contentType, userId }),
    queryFn: ({ pageParam = 1 }) => FeedAPI.getPosts(pageParam, visibility, contentType, userId),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return parseInt(url.searchParams.get("page") || "1");
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para buscar um post específico
export function usePostQuery(postId: number) {
  return useQuery({
    queryKey: feedKeys.detail(postId),
    queryFn: () => FeedAPI.getPost(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Hook para buscar comentários de um post
export function usePostCommentsQuery(postId: number) {
  return useQuery({
    queryKey: feedKeys.comments(postId),
    queryFn: () => FeedAPI.getPostComments(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Hook para buscar posts de um usuário
export function useUserPostsQuery(userId: number) {
  return useInfiniteQuery({
    queryKey: feedKeys.userPosts(userId),
    queryFn: ({ pageParam = 1 }) => FeedAPI.getUserPosts(userId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return parseInt(url.searchParams.get("page") || "1");
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para criar um post
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostData) => FeedAPI.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      toast.success("Post criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao criar post:", error);
      toast.error(error.message || "Erro ao criar post");
    },
  });
}

// Hook para deletar um post
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => FeedAPI.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      toast.success("Post deletado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar post");
    },
  });
}

// Hook para curtir/descurtir um post
export function useTogglePostLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => FeedAPI.togglePostLike(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: feedKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: feedKeys.lists() });

      // Optimistically update
      queryClient.setQueriesData({ queryKey: feedKeys.lists() }, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            results: page.results.map((post: any) =>
              post.id === postId
                ? {
                    ...post,
                    is_liked_by_user: !post.is_liked_by_user,
                    likes_count: post.is_liked_by_user ? post.likes_count - 1 : post.likes_count + 1,
                  }
                : post
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Erro ao curtir post");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}

// Hook para adicionar comentário
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, text }: { postId: number; text: string }) => FeedAPI.addComment(postId, text),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: feedKeys.detail(variables.postId) });
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      toast.success("Comentário adicionado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar comentário");
    },
  });
}

// Hook para deletar comentário
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => FeedAPI.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      toast.success("Comentário deletado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar comentário");
    },
  });
}

// Hook para curtir/descurtir comentário
export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => FeedAPI.toggleCommentLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao curtir comentário");
    },
  });
}

// Hook para criar denúncia
export function useCreateReport() {
  return useMutation({
    mutationFn: (data: CreateReportData) => FeedAPI.createReport(data),
    onSuccess: () => {
      toast.success("Denúncia enviada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar denúncia");
    },
  });
}
