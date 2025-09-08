"use client";

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings,
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
  Droplets,
  User,
  Users
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
    importSettings 
  } = useSettings();
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("notifications");

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

  const sections = [
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'workout', label: 'Treinos', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrição', icon: Utensils },
    { id: 'interface', label: 'Interface', icon: Palette },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
    { id: 'goals', label: 'Metas', icon: Target },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Configurações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Personalize sua experiência no XPump
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="border-orange-500/20 text-orange-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
            className="gap-2"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection(section.id)}
              className="gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {/* Notificações */}
      {activeSection === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Configurações de Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium capitalize">{key}</Label>
                    <p className="text-xs text-muted-foreground">
                      {key === 'achievements' && 'Receber notificações de novas conquistas'}
                      {key === 'reminders' && 'Lembretes de treinos e refeições'}
                      {key === 'social' && 'Curtidas, comentários e seguidas'}
                      {key === 'streaks' && 'Alertas sobre sequências de treinos'}
                      {key === 'challenges' && 'Novos desafios e competições'}
                      {key === 'email' && 'Resumos semanais por e-mail'}
                      {key === 'push' && 'Notificações no dispositivo'}
                    </p>
                  </div>
                  <Button
                    variant={value ? "default" : "outline"}
                    size="sm"
                    onClick={() => 
                      updateSettings({ 
                        notifications: { ...settings.notifications, [key]: !value }
                      })
                    }
                  >
                    {value ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treinos */}
      {activeSection === 'workout' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Preferências de Treino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duração Padrão (minutos)</Label>
                <Input
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={settings.workout.defaultDuration}
                  onChange={(e) =>
                    updateSettings({ 
                      workout: { ...settings.workout, defaultDuration: parseInt(e.target.value) }
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Horário Preferido</Label>
                <select
                  value={settings.workout.preferredTime}
                  onChange={(e) =>
                    updateSettings({ 
                      workout: { ...settings.workout, preferredTime: e.target.value as any }
                    })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="morning">Manhã (6h - 12h)</option>
                  <option value="afternoon">Tarde (12h - 18h)</option>
                  <option value="evening">Noite (18h - 22h)</option>
                  <option value="any">Qualquer horário</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Nível de Intensidade</Label>
                <select
                  value={settings.workout.intensityLevel}
                  onChange={(e) =>
                    updateSettings({ 
                      workout: { ...settings.workout, intensityLevel: e.target.value as any }
                    })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Lembretes Automáticos</Label>
                  <p className="text-xs text-muted-foreground">Lembrar de treinar no horário definido</p>
                </div>
                <Button
                  variant={settings.workout.autoReminders ? "default" : "outline"}
                  size="sm"
                  onClick={() => 
                    updateSettings({ 
                      workout: { ...settings.workout, autoReminders: !settings.workout.autoReminders }
                    })
                  }
                >
                  {settings.workout.autoReminders ? 'Ativado' : 'Desativado'}
                </Button>
              </div>

              {settings.workout.autoReminders && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Horário do Lembrete</Label>
                  <Input
                    type="time"
                    value={settings.workout.reminderTime}
                    onChange={(e) =>
                      updateSettings({ 
                        workout: { ...settings.workout, reminderTime: e.target.value }
                      })
                    }
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interface */}
      {activeSection === 'interface' && (
        <Card>
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
                  {settings.interface.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Tema
                </Label>
                <select
                  value={settings.interface.theme}
                  onChange={(e) =>
                    updateSettings({ 
                      interface: { ...settings.interface, theme: e.target.value as any }
                    })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="dark">Escuro</option>
                  <option value="light">Claro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Idioma
                </Label>
                <select
                  value={settings.interface.language}
                  onChange={(e) =>
                    updateSettings({ 
                      interface: { ...settings.interface, language: e.target.value as any }
                    })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {Object.entries({
                compactMode: 'Modo Compacto',
                animations: 'Animações',
                sounds: 'Sons'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">
                      {key === 'compactMode' && 'Interface mais densa com menos espaçamentos'}
                      {key === 'animations' && 'Animações e transições visuais'}
                      {key === 'sounds' && 'Sons de notificação e feedback'}
                    </p>
                  </div>
                  <Button
                    variant={settings.interface[key as keyof typeof settings.interface] ? "default" : "outline"}
                    size="sm"
                    onClick={() => 
                      updateSettings({ 
                        interface: { 
                          ...settings.interface, 
                          [key]: !settings.interface[key as keyof typeof settings.interface] 
                        }
                      })
                    }
                  >
                    {settings.interface[key as keyof typeof settings.interface] ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metas */}
      {activeSection === 'goals' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Metas e Objetivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Treinos por Semana</Label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={settings.goals.weeklyWorkouts}
                    onChange={(e) =>
                      updateSettings({ 
                        goals: { ...settings.goals, weeklyWorkouts: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Refeições por Dia</Label>
                  <Input
                    type="number"
                    min="3"
                    max="6"
                    value={settings.goals.dailyMeals}
                    onChange={(e) =>
                      updateSettings({ 
                        goals: { ...settings.goals, dailyMeals: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pontos por Semana</Label>
                  <Input
                    type="number"
                    min="500"
                    max="3000"
                    step="100"
                    value={settings.goals.weeklyPoints}
                    onChange={(e) =>
                      updateSettings({ 
                        goals: { ...settings.goals, weeklyPoints: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Peso Alvo (kg)</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={settings.goals.weight.target || ''}
                    onChange={(e) =>
                      updateSettings({ 
                        goals: { 
                          ...settings.goals, 
                          weight: { 
                            ...settings.goals.weight, 
                            target: e.target.value ? parseFloat(e.target.value) : null 
                          }
                        }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">% Gordura Alvo</Label>
                  <Input
                    type="number"
                    placeholder="15"
                    value={settings.goals.bodyFat.target || ''}
                    onChange={(e) =>
                      updateSettings({ 
                        goals: { 
                          ...settings.goals, 
                          bodyFat: { 
                            target: e.target.value ? parseFloat(e.target.value) : null 
                          }
                        }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações de configuração */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Gerenciar Configurações</h3>
              <p className="text-sm text-muted-foreground">
                Exporte, importe ou redefina suas configurações
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportSettings}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => document.getElementById('import-settings')?.click()}
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
