"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bell, Save, AlertTriangle, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeSelector } from "@/components/ui/theme-selector";

export default function SettingsPage() {
  const { settings, isLoading, hasChanges, updateSettings, saveSettings } = useSettings();

  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("interface");

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sections = [{ id: "interface", label: "Interface", icon: Palette }];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Configurações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Personalize sua experiência no XPump</p>
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
              className={cn("gap-2", activeSection !== section.id && "text-muted-foreground")}
            >
              <IconComponent className="h-4 w-4" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {/* Interface */}
      {activeSection === "interface" && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Configurações de Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <ThemeSelector />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
