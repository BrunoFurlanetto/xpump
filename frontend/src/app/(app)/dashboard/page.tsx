"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Target, Upload, CheckCircle, Clock, Star, X } from "lucide-react";
import Confetti from "react-confetti";

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  category: "workout" | "nutrition" | "habit";
  deadline?: string;
  completed: boolean;
}

const missions: Mission[] = [
  {
    id: "1",
    title: "Complete 5 treinos esta semana",
    description: "Realize 5 sessões de treino completas durante a semana",
    points: 100,
    difficulty: "medium",
    category: "workout",
    deadline: "2024-08-20",
    completed: false,
  },
  {
    id: "2",
    title: "Beba 2L de água por dia",
    description: "Mantenha-se hidratado bebendo pelo menos 2 litros de água diariamente por 3 dias",
    points: 50,
    difficulty: "easy",
    category: "habit",
    deadline: "2024-08-16",
    completed: false,
  },
  {
    id: "3",
    title: "Faça um treino de 1 hora",
    description: "Complete uma sessão de treino com duração mínima de 60 minutos",
    points: 75,
    difficulty: "medium",
    category: "workout",
    completed: false,
  },
  {
    id: "4",
    title: "Prepare 3 refeições saudáveis",
    description: "Cozinhe 3 refeições balanceadas e nutritivas",
    points: 80,
    difficulty: "medium",
    category: "nutrition",
    completed: false,
  },
];

export default function HomePage() {
  const [missionsList, setMissionsList] = useState<Mission[]>(missions);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [showTrophy, setShowTrophy] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);

  const getDifficultyColor = (difficulty: Mission["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-400 border-red-500/20";
    }
  };

  const getCategoryIcon = (category: Mission["category"]) => {
    switch (category) {
      case "workout":
        return <Target className="h-4 w-4" />;
      case "nutrition":
        return <Star className="h-4 w-4" />;
      case "habit":
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
    }
  };

  const openMissionModal = (mission: Mission) => {
    setSelectedMission(mission);
    setShowMissionModal(true);
  };

  const closeMissionModal = () => {
    setShowMissionModal(false);
    setSelectedMission(null);
    setProofText("");
    setProofImage(null);
  };

  const completeMission = () => {
    if (!selectedMission || (!proofText.trim() && !proofImage)) return;

    // Atualizar a missão como completa
    setMissionsList((prev) =>
      prev.map((mission) => (mission.id === selectedMission.id ? { ...mission, completed: true } : mission))
    );

    // Mostrar celebração
    setShowTrophy(true);
    setShowConfetti(true);

    // Fechar modal
    closeMissionModal();

    // Parar celebração após 4 segundos
    setTimeout(() => {
      setShowTrophy(false);
      setShowConfetti(false);
    }, 4000);
  };

  return (
    <>
      {/* Confetti de comemoração */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          colors={["#FFD700", "#FFA500", "#FF6347", "#32CD32", "#4169E1", "#9370DB"]}
        />
      )}

      {/* Modal do Troféu */}
      {showTrophy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-8 rounded-3xl shadow-2xl text-center animate-pulse">
            <div className="mb-4">
              <Trophy className="h-24 w-24 mx-auto text-white animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Missão Completa!</h2>
            <p className="text-xl text-yellow-100 mb-2">{selectedMission?.title}</p>
            <div className="flex items-center justify-center gap-2 text-white">
              <Star className="h-5 w-5" />
              <span className="font-bold">+{selectedMission?.points} pontos</span>
              <Star className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Completar Missão */}
      {showMissionModal && selectedMission && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completar Missão</h3>
              <Button variant="ghost" size="sm" onClick={closeMissionModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1 text-gray-900 dark:text-white">{selectedMission.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedMission.description}</p>
              </div>

              <div>
                <label htmlFor="proof-text" className="text-sm font-medium text-gray-900 dark:text-white block mb-1">
                  Compartilhe sua conquista (opcional)
                </label>
                <Textarea
                  id="proof-text"
                  placeholder="Conte como foi completar essa missão..."
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="bg-muted/50 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>

              <div>
                <label
                  htmlFor="proof-image"
                  className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white mb-2"
                >
                  <Upload className="h-4 w-4" />
                  Foto de comprovação
                </label>
                <input
                  id="proof-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 bg-muted/50 border border-gray-300 dark:border-gray-600 rounded-md"
                />
                {proofImage && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✓ Foto selecionada: {proofImage.name}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={closeMissionModal} className="flex-1 text-white">
                  Cancelar
                </Button>
                <Button onClick={completeMission} disabled={!proofText.trim() && !proofImage} className="flex-1">
                  <Trophy className="h-4 w-4 mr-2" />
                  Finalizar (+{selectedMission.points} pts)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao XPump! Aqui você pode acompanhar seus treinos e progresso.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Treinos desta semana</h3>
            </div>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 desde a semana passada</p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Grupos ativos</h3>
            </div>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Participando de 3 grupos</p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Tempo total</h3>
            </div>
            <div className="text-2xl font-bold">45h</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Streak</h3>
            </div>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">dias consecutivos</p>
          </div>
        </div>

        {/* Missões Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Missões Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {missionsList
                .filter((mission) => !mission.completed)
                .map((mission) => (
                  <div key={mission.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(mission.category)}
                        <h4 className="font-semibold">{mission.title}</h4>
                      </div>
                      <Badge className={getDifficultyColor(mission.difficulty)}>{mission.difficulty}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star className="h-4 w-4" />
                          {mission.points} pts
                        </span>
                        {mission.deadline && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(mission.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <Button size="sm" onClick={() => openMissionModal(mission)}>
                        Completar
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            {missionsList.filter((mission) => !mission.completed).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Todas as missões foram completadas! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missões Completadas */}
        {missionsList.filter((mission) => mission.completed).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Missões Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {missionsList
                  .filter((mission) => mission.completed)
                  .map((mission) => (
                    <div
                      key={mission.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="font-medium text-green-400">{mission.title}</p>
                          <p className="text-sm text-muted-foreground">Missão concluída</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                        +{mission.points} pts
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximos Treinos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos treinos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">Treino de peito e tríceps</p>
                  <p className="text-sm text-muted-foreground">Hoje às 18:00</p>
                </div>
                <div className="text-sm text-primary font-medium">Em 2h</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">Treino de costas e bíceps</p>
                  <p className="text-sm text-muted-foreground">Amanhã às 07:00</p>
                </div>
                <div className="text-sm text-muted-foreground">Em 15h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
