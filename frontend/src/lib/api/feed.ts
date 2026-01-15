// Types
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  profile_id: number;
  profile_score: number;
  level: number;
}

export interface ContentFile {
  id: number;
  file: string;
  uploaded_at: string;
}

export interface PostLike {
  id: number;
  user: User;
  created_at: string;
}

export interface CommentLike {
  id: number;
  user: User;
  created_at: string;
}

export interface Comment {
  id: number;
  user: User;
  text: string;
  created_at: string;
  likes: CommentLike[];
  likes_count: number;
  is_liked_by_user: boolean;
}

export interface WorkoutCheckin {
  id: number;
  location?: string;
  comments: string;
  workout_date: string;
  duration: string;
  base_points: number;
  multiplier: number;
  validation_status: number;
  validation_status_name: string;
  created_at: string;
  proofs: ContentFile[];
}

export interface Meal {
  id: number;
  meal_type_id: number;
  meal_type_name: string;
  meal_time: string;
  comments?: string;
  base_points: number;
  multiplier: number;
  validation_status: number;
  validation_status_name: string;
  created_at: string;
  proofs: ContentFile[];
  fasting: boolean;
}

export interface Post {
  id: number;
  user: User;
  content_type: "workout" | "meal" | "social" | "achievement";
  content_text?: string;
  content_files: ContentFile[];
  workout_checkin?: WorkoutCheckin;
  meal?: Meal;
  comments_count: number;
  likes_count: number;
  created_at: string;
  visibility: "global" | "group" | "private";
  allow_comments: boolean;
  comments?: Comment[];
  likes?: PostLike[];
  is_liked_by_user: boolean;
}

export interface PostList {
  id: number;
  user: User;
  content_type: "workout" | "meal" | "social" | "achievement";
  content_text?: string;
  content_files: ContentFile[];
  workout_checkin?: WorkoutCheckin;
  meal?: Meal;
  comments_count: number;
  likes_count: number;
  created_at: string;
  visibility: "global" | "group" | "private";
  allow_comments: boolean;
  is_liked_by_user: boolean;
}

export interface PaginatedPosts {
  count: number;
  next: string | null;
  previous: string | null;
  results: PostList[];
}

export interface CreatePostData {
  content_type: "workout" | "meal" | "social" | "achievement";
  content_text?: string;
  files?: File[];
  workout_checkin?: number;
  meal?: number;
  visibility?: "global" | "group" | "private";
  allow_comments?: boolean;
}

export interface CreateCommentData {
  post: number;
  text: string;
}

export interface CreateReportData {
  report_type: "post" | "comment";
  post?: number;
  comment?: number;
  reason: "spam" | "inappropriate" | "harassment" | "fake" | "other";
  other_reason?: string;
}

export interface ToggleLikeResponse {
  liked: boolean;
  post_id?: number;
  comment_id?: number;
  likes_count?: number;
}

// Feed API Class
export class FeedAPI {
  /**
   * Get paginated feed posts
   */
  static async getPosts(
    page: number = 1,
    visibility?: "global" | "group" | "private",
    contentType?: "workout" | "meal" | "social" | "achievement",
    userId?: number
  ): Promise<PaginatedPosts> {
    const params = new URLSearchParams({
      page: page.toString(),
    });

    if (visibility) params.append("visibility", visibility);
    if (contentType) params.append("content_type", contentType);
    if (userId) params.append("user_id", userId.toString());

    const response = await fetch(`/api/v1/social-feed/posts/?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar posts");
    }

    return response.json();
  }

  /**
   * Get a single post by ID
   */
  static async getPost(postId: number): Promise<Post> {
    const response = await fetch(`/api/v1/social-feed/posts/${postId}/`);

    if (!response.ok) {
      throw new Error("Erro ao buscar post");
    }

    return response.json();
  }

  /**
   * Create a new post
   */
  static async createPost(data: CreatePostData): Promise<Post> {
    const formData = new FormData();
    formData.append("content_type", data.content_type);

    if (data.content_text) formData.append("content_text", data.content_text);
    if (data.workout_checkin) formData.append("workout_checkin", data.workout_checkin.toString());
    if (data.meal) formData.append("meal", data.meal.toString());
    if (data.visibility) formData.append("visibility", data.visibility);
    if (data.allow_comments !== undefined) formData.append("allow_comments", data.allow_comments.toString());

    if (data.files) {
      data.files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const response = await fetch("/api/v1/social-feed/posts/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Erro ao criar post");
    }

    return response.json();
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: number): Promise<void> {
    const response = await fetch(`/api/v1/social-feed/posts/${postId}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar post");
    }
  }

  /**
   * Toggle like on a post
   */
  static async togglePostLike(postId: number): Promise<ToggleLikeResponse> {
    const response = await fetch(`/api/v1/social-feed/posts/${postId}/toggle_like/`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Erro ao curtir/descurtir post");
    }

    return response.json();
  }

  /**
   * Get comments for a post
   */
  static async getPostComments(
    postId: number,
    page: number = 1
  ): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Comment[];
  }> {
    const response = await fetch(`/api/v1/social-feed/posts/${postId}/comments/?page=${page}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar comentários");
    }

    return response.json();
  }

  /**
   * Add a comment to a post
   */
  static async addComment(postId: number, text: string): Promise<Comment> {
    const response = await fetch(`/api/v1/social-feed/posts/${postId}/add_comment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Erro ao adicionar comentário");
    }

    return response.json();
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: number): Promise<void> {
    const response = await fetch(`/api/v1/social-feed/comments/${commentId}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar comentário");
    }
  }

  /**
   * Toggle like on a comment
   */
  static async toggleCommentLike(commentId: number): Promise<ToggleLikeResponse> {
    const response = await fetch(`/api/v1/social-feed/comments/${commentId}/toggle-like/`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Erro ao curtir/descurtir comentário");
    }

    return response.json();
  }

  /**
   * Get posts by a specific user
   */
  static async getUserPosts(userId: number, page: number = 1): Promise<PaginatedPosts> {
    const response = await fetch(`/api/v1/social-feed/users/${userId}/posts/?page=${page}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar posts do usuário");
    }

    return response.json();
  }

  /**
   * Create a report
   */
  static async createReport(data: CreateReportData): Promise<void> {
    const response = await fetch("/api/v1/social-feed/reports/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Erro ao criar denúncia");
    }
  }
}
