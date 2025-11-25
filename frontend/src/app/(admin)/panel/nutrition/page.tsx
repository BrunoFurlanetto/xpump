"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminAPI, AdminMealDetail } from "@/lib/api/admin";
import { Calendar, Clock, Eye, Check, X, Filter, Utensils } from "lucide-react";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Dados mockados para desenvolvimento do layout
const MOCK_MEALS: AdminMealDetail[] = [
  {
    id: 1,
    user_id: 5,
    username: "João Silva",
    meal_type_id: 1,
    meal_type_name: "Café da Manhã",
    meal_time: new Date().toISOString(),
    comments: "Ovos mexidos com aveia e frutas. Proteína de qualidade para começar o dia!",
    base_points: 50,
    multiplier: 1.0,
    validation_status: 0,
    validation_status_name: "Pendente",
    proofs: [{ id: 1, file: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400" }],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 8,
    username: "Maria Santos",
    meal_type_id: 2,
    meal_type_name: "Almoço",
    meal_time: new Date(Date.now() - 1800000).toISOString(),
    comments: "Frango grelhado com batata doce e salada verde. Refeição completa e balanceada.",
    base_points: 80,
    multiplier: 1.2,
    validation_status: 1,
    validation_status_name: "Aprovado",
    proofs: [
      { id: 2, file: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" },
      { id: 3, file: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400" },
    ],
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 3,
    user_id: 12,
    username: "Carlos Oliveira",
    meal_type_id: 4,
    meal_type_name: "Lanche da Tarde",
    meal_time: new Date(Date.now() - 5400000).toISOString(),
    comments: "Whey protein com banana e pasta de amendoim. Lanche pós-treino perfeito!",
    base_points: 40,
    multiplier: 1.0,
    validation_status: 1,
    validation_status_name: "Aprovado",
    proofs: [],
    created_at: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 4,
    user_id: 3,
    username: "Ana Costa",
    meal_type_id: 2,
    meal_type_name: "Almoço",
    meal_time: new Date(Date.now() - 7200000).toISOString(),
    comments: "Salmão assado com quinoa e brócolis. Rico em ômega 3 e proteínas.",
    base_points: 90,
    multiplier: 1.5,
    validation_status: 0,
    validation_status_name: "Pendente",
    proofs: [{ id: 4, file: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400" }],
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 5,
    user_id: 15,
    username: "Pedro Alves",
    meal_type_id: 1,
    meal_type_name: "Café da Manhã",
    meal_time: new Date(Date.now() - 21600000).toISOString(),
    comments: "Tapioca com queijo e ovo. Carboidrato de qualidade para energia.",
    base_points: 60,
    multiplier: 1.0,
    validation_status: 1,
    validation_status_name: "Aprovado",
    proofs: [{ id: 5, file: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400" }],
    created_at: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 6,
    user_id: 7,
    username: "Juliana Ferreira",
    meal_type_id: 3,
    meal_type_name: "Jantar",
    meal_time: new Date(Date.now() - 3600000).toISOString(),
    comments: "Carne magra com legumes no vapor. Leve e nutritivo para a noite.",
    base_points: 75,
    multiplier: 1.1,
    validation_status: 1,
    validation_status_name: "Aprovado",
    proofs: [{ id: 6, file: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400" }],
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 7,
    user_id: 11,
    username: "Rafael Mendes",
    meal_type_id: 4,
    meal_type_name: "Lanche da Tarde",
    meal_time: new Date(Date.now() - 10800000).toISOString(),
    comments: "Iogurte grego com granola e mel. Proteína e carboidrato balanceados.",
    base_points: 45,
    multiplier: 1.0,
    validation_status: 0,
    validation_status_name: "Pendente",
    proofs: [{ id: 7, file: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400" }],
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 8,
    user_id: 20,
    username: "Fernanda Lima",
    meal_type_id: 1,
    meal_type_name: "Café da Manhã",
    meal_time: new Date(Date.now() - 25200000).toISOString(),
    comments: "Panqueca de aveia com frutas vermelhas. Delicioso e saudável!",
    base_points: 55,
    multiplier: 1.0,
    validation_status: 1,
    validation_status_name: "Aprovado",
    proofs: [{ id: 8, file: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400" }],
    created_at: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: 9,
    user_id: 18,
    username: "Bruno Castro",
    meal_type_id: 2,
    meal_type_name: "Almoço",
    meal_time: new Date(Date.now() - 14400000).toISOString(),
    comments: "Arroz integral, feijão, peito de frango e salada.",
    base_points: 85,
    multiplier: 1.0,
    validation_status: -1,
    validation_status_name: "Rejeitado",
    proofs: [],
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 10,
    user_id: 9,
    username: "Camila Rodrigues",
    meal_type_id: 3,
    meal_type_name: "Jantar",
    meal_time: new Date(Date.now() - 7200000).toISOString(),
    comments: "Omelete de claras com queijo cottage e espinafre. Alto teor proteico.",
    base_points: 70,
    multiplier: 1.2,
    validation_status: 1,
    validation_status_name: "Aprovado",
    proofs: [{ id: 9, file: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400" }],
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 11,
    user_id: 22,
    username: "Lucas Martins",
    meal_type_id: 4,
    meal_type_name: "Lanche da Tarde",
    meal_time: new Date(Date.now() - 18000000).toISOString(),
    comments: "Mix de castanhas e frutas secas. Gorduras boas e energia.",
    base_points: 35,
    multiplier: 1.0,
    validation_status: 1,
    validation_status_name: "Aprovado",
    proofs: [],
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 12,
    user_id: 14,
    username: "Beatriz Souza",
    meal_type_id: 2,
    meal_type_name: "Almoço",
    meal_time: new Date(Date.now() - 10800000).toISOString(),
    comments: "Peixe grelhado com arroz integral e legumes assados.",
    base_points: 88,
    multiplier: 1.3,
    validation_status: 0,
    validation_status_name: "Pendente",
    proofs: [{ id: 10, file: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400" }],
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

export default function NutritionPage() {
  const [meals, setMeals] = useState<AdminMealDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<AdminMealDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const checkSelectedGroup = () => {
      const savedGroupId = localStorage.getItem("adminSelectedGroupId");
      if (savedGroupId) {
        setSelectedGroupId(parseInt(savedGroupId));
      }
    };

    checkSelectedGroup();
    const interval = setInterval(checkSelectedGroup, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadMeals();
    }
  }, [selectedGroupId, statusFilter]);

  const loadMeals = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      // TODO: Descomentar quando o endpoint estiver pronto
      // const filters = statusFilter !== "all" ? { status: parseInt(statusFilter) } : undefined;
      // const data = await AdminAPI.getGroupMeals(selectedGroupId, filters);
      // setMeals(data);

      // Usando dados mockados temporariamente
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simula delay de rede

      // Aplicar filtro de status nos dados mockados
      let filteredMeals = MOCK_MEALS;
      if (statusFilter !== "all") {
        const statusValue = parseInt(statusFilter);
        filteredMeals = MOCK_MEALS.filter((m) => m.validation_status === statusValue);
      }

      setMeals(filteredMeals);
    } catch (error) {
      console.error("Erro ao carregar refeições:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (mealId: number, status: number) => {
    try {
      // TODO: Descomentar quando o endpoint estiver pronto
      // await AdminAPI.updateMealValidation(mealId, { validation_status: status });

      // Simulando validação com dados mockados
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Atualizar localmente para feedback imediato
      const updatedMeals = meals.map((m) =>
        m.id === mealId
          ? {
              ...m,
              validation_status: status,
              validation_status_name: status === 1 ? "Aprovado" : status === -1 ? "Rejeitado" : "Pendente",
            }
          : m
      );
      setMeals(updatedMeals);

      setSelectedMeal(null);
      // loadMeals(); // Descomente quando usar API real
    } catch (error) {
      console.error("Erro ao validar refeição:", error);
    }
  };

  const getMealIcon = (mealType: string) => {
    const icons: { [key: string]: string } = {
      breakfast: "🌅",
      lunch: "🍽️",
      afternoon_snack: "🥤",
      dinner: "🌙",
      snack: "🍎",
    };
    return icons[mealType] || "🍴";
  };

  if (!selectedGroupId) {
    return null;
  }

  if (loading) {
    return <NutritionSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Alimentação</h1>
          <p className="text-muted-foreground">Visualize e modere os registros de refeições</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Aprovados</SelectItem>
              <SelectItem value="0">Pendentes</SelectItem>
              <SelectItem value="-1">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Refeições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {meals.filter((m) => m.validation_status === 1).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {meals.filter((m) => m.validation_status === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meals List */}
      <Card>
        <CardHeader>
          <CardTitle>Refeições Registradas</CardTitle>
          <CardDescription>{meals.length} refeição(ões) encontrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma refeição encontrada</p>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{meal.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{meal.username}</p>
                        <span className="text-lg">{getMealIcon(meal.meal_type_name)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          {meal.meal_type_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(meal.meal_time).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(meal.meal_time).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {meal.comments && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{meal.comments}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        meal.validation_status === 1
                          ? "default"
                          : meal.validation_status === 0
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {meal.validation_status_name}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setSelectedMeal(meal)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meal Detail Dialog */}
      <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMeal && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Refeição</DialogTitle>
                <DialogDescription>Refeição de {selectedMeal.username}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{selectedMeal.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMeal.username}</p>
                    <p className="text-sm text-muted-foreground">ID: {selectedMeal.user_id}</p>
                  </div>
                </div>

                {/* Meal Info */}
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo de Refeição</span>
                    <span className="font-medium flex items-center gap-2">
                      <span className="text-lg">{getMealIcon(selectedMeal.meal_type_name)}</span>
                      {selectedMeal.meal_type_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data e Hora</span>
                    <span className="font-medium">{new Date(selectedMeal.meal_time).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pontos Base</span>
                    <span className="font-medium">{selectedMeal.base_points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Multiplicador</span>
                    <span className="font-medium">{selectedMeal.multiplier}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-bold text-lg">
                      {(selectedMeal.base_points * selectedMeal.multiplier).toFixed(0)} pts
                    </span>
                  </div>
                </div>

                {/* Comments */}
                {selectedMeal.comments && (
                  <div>
                    <p className="text-sm font-medium mb-2">Comentários</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{selectedMeal.comments}</p>
                  </div>
                )}

                {/* Proofs */}
                {selectedMeal.proofs && selectedMeal.proofs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Comprovantes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedMeal.proofs.map((proof) => (
                        <div key={proof.id} className="relative aspect-video rounded-md overflow-hidden border">
                          <Image src={proof.file} alt="Comprovante" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation Actions */}
                {selectedMeal.validation_status === 0 && (
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" variant="default" onClick={() => handleValidation(selectedMeal.id, 1)}>
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleValidation(selectedMeal.id, -1)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex justify-center pt-2">
                  <Badge
                    variant={
                      selectedMeal.validation_status === 1
                        ? "default"
                        : selectedMeal.validation_status === 0
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    Status: {selectedMeal.validation_status_name}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NutritionSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b pb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-48" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
