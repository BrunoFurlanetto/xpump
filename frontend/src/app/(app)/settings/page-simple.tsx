"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell,
  Dumbbell,
  Utensils,
  Palette,
  Shield,
  Target,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Moon,
  Sun,
  Globe,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const {
    settings,
    isLoading,
    hasChanges,
    updateSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
  } = useSettings();

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveSettings();

    if (result.success) {
      toast.success("Configurações salvas com sucesso!");
    } else {
      toast.error("Erro ao salvar configurações");
    }

    setIsSaving(false);
  };

  const handleReset = () => {
    resetSettings();
    toast.info("Configurações resetadas para o padrão");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importSettings(file)
      .then(() => {
        toast.success("Configurações importadas com sucesso!");
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Configurações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Personalize sua experiência no Start</p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="border-orange-500/20 text-orange-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}

          <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm" className="gap-2">
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="workout" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Treinos</span>
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="gap-2">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Nutrição</span>
          </TabsTrigger>
          <TabsTrigger value="interface" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Interface</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacidade</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Metas</span>
          </TabsTrigger>
        </TabsList>

        {/* Notificações */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Conquistas</Label>
                    <p className="text-xs text-muted-foreground">Receber notificações de novas conquistas</p>
                  </div>
                  <Switch
                    checked={settings.notifications.achievements}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        notifications: { ...settings.notifications, achievements: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Lembretes</Label>
                    <p className="text-xs text-muted-foreground">Lembretes de treinos e refeições</p>
                  </div>
                  <Switch
                    checked={settings.notifications.reminders}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        notifications: { ...settings.notifications, reminders: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Atividades Sociais</Label>
                    <p className="text-xs text-muted-foreground">Curtidas, comentários e seguidas</p>
                  </div>
                  <Switch
                    checked={settings.notifications.social}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        notifications: { ...settings.notifications, social: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Sequências</Label>
                    <p className="text-xs text-muted-foreground">Alertas sobre sequências de treinos</p>
                  </div>
                  <Switch
                    checked={settings.notifications.streaks}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        notifications: { ...settings.notifications, streaks: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Desafios</Label>
                    <p className="text-xs text-muted-foreground">Novos desafios e competições</p>
                  </div>
                  <Switch
                    checked={settings.notifications.challenges}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        notifications: { ...settings.notifications, challenges: checked },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Canais de Notificação</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Notificações Push</Label>
                    <p className="text-xs text-muted-foreground">Notificações no dispositivo</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        notifications: { ...settings.notifications, push: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">E-mail</Label>
                    <p className="text-xs text-muted-foreground">Resumos semanais por e-mail</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        notifications: { ...settings.notifications, email: checked },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treinos */}
        <TabsContent value="workout" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Preferências de Treino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Duração Padrão (minutos)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.workout.defaultDuration]}
                      onValueChange={([value]: [number]) =>
                        updateSettings({
                          workout: { ...settings.workout, defaultDuration: value },
                        })
                      }
                      max={180}
                      min={15}
                      step={15}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>15min</span>
                      <span className="font-medium text-foreground">{settings.workout.defaultDuration}min</span>
                      <span>180min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Horário Preferido</Label>
                  <Select
                    value={settings.workout.preferredTime}
                    onValueChange={(value: "morning" | "afternoon" | "evening" | "any") =>
                      updateSettings({
                        workout: { ...settings.workout, preferredTime: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Manhã (6h - 12h)</SelectItem>
                      <SelectItem value="afternoon">Tarde (12h - 18h)</SelectItem>
                      <SelectItem value="evening">Noite (18h - 22h)</SelectItem>
                      <SelectItem value="any">Qualquer horário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nível de Intensidade</Label>
                  <Select
                    value={settings.workout.intensityLevel}
                    onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                      updateSettings({
                        workout: { ...settings.workout, intensityLevel: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Lembretes Automáticos</Label>
                    <p className="text-xs text-muted-foreground">Lembrar de treinar no horário definido</p>
                  </div>
                  <Switch
                    checked={settings.workout.autoReminders}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        workout: { ...settings.workout, autoReminders: checked },
                      })
                    }
                  />
                </div>

                {settings.workout.autoReminders && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Horário do Lembrete</Label>
                    <Input
                      type="time"
                      value={settings.workout.reminderTime}
                      onChange={(e) =>
                        updateSettings({
                          workout: { ...settings.workout, reminderTime: e.target.value },
                        })
                      }
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interface */}
        <TabsContent value="interface" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Configurações de Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    {settings.interface.theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Tema
                  </Label>
                  <Select
                    value={settings.interface.theme}
                    onValueChange={(value: "dark" | "light" | "system") =>
                      updateSettings({
                        interface: { ...settings.interface, theme: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Idioma
                  </Label>
                  <Select
                    value={settings.interface.language}
                    onValueChange={(value: "pt" | "en" | "es") =>
                      updateSettings({
                        interface: { ...settings.interface, language: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Modo Compacto</Label>
                    <p className="text-xs text-muted-foreground">Interface mais densa com menos espaçamentos</p>
                  </div>
                  <Switch
                    checked={settings.interface.compactMode}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        interface: { ...settings.interface, compactMode: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Animações
                    </Label>
                    <p className="text-xs text-muted-foreground">Animações e transições visuais</p>
                  </div>
                  <Switch
                    checked={settings.interface.animations}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        interface: { ...settings.interface, animations: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {settings.interface.sounds ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Sons
                    </Label>
                    <p className="text-xs text-muted-foreground">Sons de notificação e feedback</p>
                  </div>
                  <Switch
                    checked={settings.interface.sounds}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({
                        interface: { ...settings.interface, sounds: checked },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metas */}
        <TabsContent value="goals" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Metas e Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Treinos por Semana</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.goals.weeklyWorkouts]}
                      onValueChange={([value]: [number]) =>
                        updateSettings({
                          goals: { ...settings.goals, weeklyWorkouts: value },
                        })
                      }
                      max={7}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1x</span>
                      <span className="font-medium text-foreground">{settings.goals.weeklyWorkouts}x por semana</span>
                      <span>7x</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Refeições por Dia</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.goals.dailyMeals]}
                      onValueChange={([value]: [number]) =>
                        updateSettings({
                          goals: { ...settings.goals, dailyMeals: value },
                        })
                      }
                      max={6}
                      min={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3</span>
                      <span className="font-medium text-foreground">{settings.goals.dailyMeals} refeições/dia</span>
                      <span>6</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Pontos por Semana</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.goals.weeklyPoints]}
                      onValueChange={([value]: [number]) =>
                        updateSettings({
                          goals: { ...settings.goals, weeklyPoints: value },
                        })
                      }
                      max={3000}
                      min={500}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>500</span>
                      <span className="font-medium text-foreground">{settings.goals.weeklyPoints} pontos/semana</span>
                      <span>3000</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações de configuração */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Gerenciar Configurações</h3>
              <p className="text-sm text-muted-foreground">Exporte, importe ou redefina suas configurações</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={exportSettings} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => document.getElementById("import-settings")?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Importar
                </Button>
                <input
                  id="import-settings"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
