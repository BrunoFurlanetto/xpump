"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Confetti from "react-confetti";
import {
  Heart,
  MessageCircle,
  Share2,
  Camera,
  Trophy,
  Dumbbell,
  Utensils,
  Target,
  MoreHorizontal,
  Send,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

// Tipos para TypeScript
interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  level: number;
  verified?: boolean;
}

interface Post {
  id: string;
  user: User;
  content: string;
  images?: string[];
  type: "workout" | "meal" | "achievement" | "general";
  createdAt: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  workoutData?: {
    exercise: string;
    sets: number;
    reps: number;
    weight?: number;
  };
  achievementData?: {
    title: string;
    description: string;
    points: number;
  };
}

interface Comment {
  id: string;
  user: User;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

// Mock data
const mockPosts: Post[] = [
  {
    id: "video-post",
    user: {
      id: "user_lucas",
      name: "Lucas Phelps",
      username: "@lucas_beast",
      avatar: "/lucasphelps.png",
      level: 18,
      verified: true,
    },
    content:
      "Treino de hoje foi intenso! 🔥 Compartilhando com vocês alguns exercícios que têm me ajudado muito na evolução. Foco, determinação e muito suor! #XPumpMotivation #StopTalkingStartDoing",
    images: ["/tmp/video.mp4"],
    type: "workout",
    createdAt: "2024-08-13T12:00:00Z",
    likes: 156,
    comments: [
      {
        id: "cv1",
        user: {
          id: "user1",
          name: "Maria Silva",
          username: "@maria_fit",
          level: 15,
        },
        content: "Que treino insano! Inspiração total! 💪🔥",
        createdAt: "2024-08-13T12:05:00Z",
        likes: 12,
        isLiked: true,
      },
      {
        id: "cv2",
        user: {
          id: "user2",
          name: "João Santos",
          username: "@joao_beast",
          level: 12,
        },
        content: "Stop talking, start doing! 👏 Vou aplicar essas dicas hoje!",
        createdAt: "2024-08-13T12:10:00Z",
        likes: 8,
        isLiked: false,
      },
    ],
    isLiked: true,
    workoutData: {
      exercise: "Circuito Funcional",
      sets: 5,
      reps: 20,
      weight: 0,
    },
  },
  {
    id: "photo-post",
    user: {
      id: "user_lucas2",
      name: "Lucas Phelps",
      username: "@lucas_beast",
      avatar: "/lucasphelps.png",
      level: 18,
      verified: true,
    },
    content:
      "Foto do resultado após 6 meses de dedicação total! 📸💪 Não é sobre perfeição, é sobre progresso. Cada treino, cada refeição planejada, cada dia de disciplina valeu a pena. O segredo? STOP TALKING, START DOING! 🚀 #TransformationTuesday #XPumpJourney",
    images: ["/lucasphelps.png"],
    type: "general",
    createdAt: "2024-08-13T11:30:00Z",
    likes: 203,
    comments: [
      {
        id: "cp1",
        user: {
          id: "user3",
          name: "Ana Costa",
          username: "@ana_healthy",
          level: 8,
        },
        content: "Que evolução incrível! Me motiva muito ver resultados assim! 🙌",
        createdAt: "2024-08-13T11:35:00Z",
        likes: 15,
        isLiked: true,
      },
      {
        id: "cp2",
        user: {
          id: "user4",
          name: "Carlos Nutrition",
          username: "@carlos_nutri",
          level: 20,
        },
        content: "Parabéns pela dedicação! Resultado da consistência! 👏",
        createdAt: "2024-08-13T11:45:00Z",
        likes: 6,
        isLiked: false,
      },
      {
        id: "cp3",
        user: {
          id: "user5",
          name: "Fitness Group",
          username: "@fitness_crew",
          level: 25,
        },
        content: "Isso sim é motivação pura! Vamos juntos! 🔥💪",
        createdAt: "2024-08-13T11:50:00Z",
        likes: 9,
        isLiked: true,
      },
    ],
    isLiked: true,
  },
  {
    id: "1",
    user: {
      id: "user1",
      name: "Maria Silva",
      username: "@maria_fit",
      avatar: undefined,
      level: 15,
      verified: true,
    },
    content:
      "Acabei de terminar meu treino de pernas! 💪 Consegui aumentar a carga no agachamento. Cada dia mais forte! #XPumpChallenge #LegDay",
    type: "workout",
    createdAt: "2024-08-13T10:30:00Z",
    likes: 24,
    comments: [
      {
        id: "c1",
        user: {
          id: "user2",
          name: "João Santos",
          username: "@joao_beast",
          level: 12,
        },
        content: "Parabéns! Inspiradora como sempre! 🔥",
        createdAt: "2024-08-13T10:35:00Z",
        likes: 3,
        isLiked: false,
      },
      {
        id: "c2",
        user: {
          id: "user3",
          name: "Ana Costa",
          username: "@ana_healthy",
          level: 8,
        },
        content: "Qual foi a carga que você usou?",
        createdAt: "2024-08-13T10:40:00Z",
        likes: 1,
        isLiked: true,
      },
    ],
    isLiked: true,
    workoutData: {
      exercise: "Agachamento",
      sets: 4,
      reps: 12,
      weight: 80,
    },
  },
  {
    id: "2",
    user: {
      id: "user2",
      name: "João Santos",
      username: "@joao_beast",
      level: 12,
    },
    content:
      "Nova conquista desbloqueada! 🏆 100 treinos completados no XPump! Obrigado pela motivação, galera! Vamos que vamos! 🚀",
    type: "achievement",
    createdAt: "2024-08-13T09:15:00Z",
    likes: 67,
    comments: [
      {
        id: "c3",
        user: {
          id: "user1",
          name: "Maria Silva",
          username: "@maria_fit",
          level: 15,
        },
        content: "Monstro! Parabéns! 🎉",
        createdAt: "2024-08-13T09:20:00Z",
        likes: 5,
        isLiked: true,
      },
    ],
    isLiked: false,
    achievementData: {
      title: "Centurião",
      description: "Complete 100 treinos",
      points: 500,
    },
  },
  {
    id: "3",
    user: {
      id: "user4",
      name: "Carlos Nutrition",
      username: "@carlos_nutri",
      level: 20,
      verified: true,
    },
    content:
      "Dica nutricional do dia: Proteína pós-treino é essencial! Aqui está minha receita favorita de shake: Whey + banana + aveia + amendoim. Simples e eficaz! 🥤✨",
    type: "meal",
    createdAt: "2024-08-13T08:00:00Z",
    likes: 45,
    comments: [],
    isLiked: true,
  },
  {
    id: "4",
    user: {
      id: "user5",
      name: "Fitness Group",
      username: "@fitness_crew",
      level: 25,
    },
    content:
      "Quem topa um desafio? 30 dias de consistência total! Treino + alimentação + descanso. Bora formar um grupo e nos motivarmos juntos! 🔥💪",
    type: "general",
    createdAt: "2024-08-12T20:30:00Z",
    likes: 89,
    comments: [
      {
        id: "c4",
        user: {
          id: "user1",
          name: "Maria Silva",
          username: "@maria_fit",
          level: 15,
        },
        content: "Eu topo! Quando começamos?",
        createdAt: "2024-08-12T20:35:00Z",
        likes: 8,
        isLiked: false,
      },
    ],
    isLiked: true,
  },
];

const getPostIcon = (type: Post["type"]) => {
  switch (type) {
    case "workout":
      return <Dumbbell className="h-4 w-4 text-blue-400" />;
    case "meal":
      return <Utensils className="h-4 w-4 text-green-400" />;
    case "achievement":
      return <Trophy className="h-4 w-4 text-yellow-400" />;
    default:
      return <Target className="h-4 w-4 text-purple-400" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [newPost, setNewPost] = useState("");
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateWindowDimensions();
    window.addEventListener("resize", updateWindowDimensions);

    return () => window.removeEventListener("resize", updateWindowDimensions);
  }, []);

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleCommentLike = (postId: string, commentId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      isLiked: !comment.isLiked,
                      likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                    }
                  : comment
              ),
            }
          : post
      )
    );
  };

  const handleAddComment = (postId: string) => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      user: {
        id: user.id,
        name: user.first_name + " " + user.last_name,
        username: `@${user.username}`,
        level: 10, // Mock level
      },
      content: newComment,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)));

    setNewComment("");
  };

  const handleCreatePost = () => {
    if (!newPost.trim() || !user) return;

    const post: Post = {
      id: `p${Date.now()}`,
      user: {
        id: user.id,
        name: user.first_name + " " + user.last_name,
        username: `@${user.username}`,
        level: 10, // Mock level
      },
      content: newPost,
      type: "general",
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      isLiked: false,
    };

    setPosts([post, ...posts]);
    setNewPost("");

    // Disparar fogos de artifício! 🎉
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000); // Confetti por 4 segundos
  };

  if (!user) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <>
      {/* Fogos de Artifício de Comemoração! 🎉 */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={["#3B82F6", "#8B5CF6", "#EF4444", "#10B981", "#F59E0B", "#EC4899"]}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Feed Social</h1>
          <p className="text-muted-foreground px-2 md:px-0">Compartilhe seus treinos e conquistas com a comunidade</p>
        </div>

        {/* Criar Post */}
        <Card>
          <CardHeader className="pb-3 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {user.avatar ? <AvatarImage src={user.avatar} alt={user.first_name} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:px-6">
            <Textarea
              placeholder="Compartilhe seu treino, conquista ou dica..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex flex-col md:flex-row gap-2 md:gap-0 items-center justify-between">
              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                  <Camera className="h-4 w-4 mr-1 md:mr-2" />
                  <span className=" md:inline">Foto</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                  <Dumbbell className="h-4 w-4 mr-1 md:mr-2" />
                  <span className=" md:inline">Treino</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                  <Utensils className="h-4 w-4 mr-1 md:mr-2" />
                  <span className=" md:inline">Refeição</span>
                </Button>
              </div>
              <Button onClick={handleCreatePost} disabled={!newPost.trim()} className="w-full md:w-auto">
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-3 px-4 md:px-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {post.user.avatar ? <AvatarImage src={post.user.avatar} alt={post.user.name} /> : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.user.name}</p>
                        {post.user.verified && (
                          <Badge variant="secondary" className="h-4 text-xs">
                            ✓
                          </Badge>
                        )}
                        <Badge variant="outline" className="h-4 text-xs whitespace-nowrap">
                          Nível {post.user.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.user.username}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {getPostIcon(post.type)}
                          <span className="capitalize">{post.type === "general" ? "post" : post.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 px-4 md:px-6">
                {/* Conteúdo do Post */}
                <p className="text-sm leading-relaxed">{post.content}</p>

                {/* Mídia do Post */}
                {post.images && post.images.length > 0 && (
                  <div className="space-y-2">
                    {post.images.map((image, index) => {
                      const isVideo = image.endsWith(".mp4") || image.endsWith(".webm") || image.endsWith(".mov");

                      if (isVideo) {
                        return (
                          <div
                            key={index}
                            className="relative w-full aspect-square rounded-lg overflow-hidden bg-black"
                          >
                            <video controls className="w-full h-full object-cover" preload="metadata">
                              <source src={image} type="video/mp4" />
                              Seu navegador não suporta vídeos.
                            </video>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={index}
                            className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100"
                          >
                            <Image
                              layout="fill"
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              loading="lazy"
                            />
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {/* Dados específicos do tipo de post */}
                {post.workoutData && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Dumbbell className="h-4 w-4 text-blue-400" />
                      <span className="font-semibold text-blue-400">Treino Registrado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Exercício:</span>
                        <p className="font-medium">{post.workoutData.exercise}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Séries x Reps:</span>
                        <p className="font-medium">
                          {post.workoutData.sets} x {post.workoutData.reps}
                        </p>
                      </div>
                      {post.workoutData.weight && (
                        <div>
                          <span className="text-muted-foreground">Carga:</span>
                          <p className="font-medium">{post.workoutData.weight}kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {post.achievementData && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span className="font-semibold text-yellow-400">Nova Conquista!</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{post.achievementData.title}</p>
                      <p className="text-sm text-muted-foreground">{post.achievementData.description}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-yellow-400">
                          +{post.achievementData.points} pontos
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ações do Post */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3 md:gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`gap-1 md:gap-2 ${
                        post.isLiked ? "text-red-500" : "text-muted-foreground"
                      } text-xs md:text-sm`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                      {post.likes}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                      className="gap-1 md:gap-2 text-muted-foreground text-xs md:text-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comments.length}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 md:gap-2 text-muted-foreground text-xs md:text-sm"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden md:inline">Compartilhar</span>
                    </Button>
                  </div>
                </div>

                {/* Comentários */}
                {showComments === post.id && (
                  <div className="space-y-3 pt-3 border-t">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          {comment.user.avatar ? (
                            <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{comment.user.name}</span>
                              <Badge variant="outline" className="h-3 text-xs ">
                                Nível {comment.user.level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCommentLike(post.id, comment.id)}
                              className={`h-auto p-0 gap-1 ${comment.isLiked ? "text-red-500" : ""}`}
                            >
                              <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-current" : ""}`} />
                              {comment.likes > 0 && comment.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                              Responder
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Adicionar Comentário */}
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        {user.avatar ? <AvatarImage src={user.avatar} alt={user.first_name} /> : null}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Escreva um comentário..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[40px] resize-none text-sm"
                        />
                        <Button size="sm" onClick={() => handleAddComment(post.id)} disabled={!newComment.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
