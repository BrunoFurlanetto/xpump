"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Settings, Crown, Star, Target, Utensils, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditGroupModal } from "@/components/groups/edit-group-modal";

interface GroupStats {
  total_members?: number;
  total_workouts?: number;
  total_meals?: number;
  mean_streak?: number;
  total_points?: number;
}

const GroupCardHeader = ({
  name,
  description,
  avatar,
  stats,
  currentUserRole,
  groupId,
}: {
  name: string;
  description: string;
  avatar?: string | null;
  stats?: GroupStats;
  currentUserRole: "owner" | "admin" | "member";
  groupId?: number;
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const canEdit = currentUserRole === "owner" || currentUserRole === "admin";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="border-border overflow-hidden">
        {/* Background Gradient */}
        <div className="h-24 sm:h-32 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

          {/* Action Button - Only for owner/admin */}
          {canEdit && (
            <div className="hidden sm:block absolute top-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span>Editar Grupo</span>
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16 sm:-mt-20">
            {/* Avatar com Badge de Role */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-background border-2 border-border shadow-xl">
                {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>

              {/* Role Badge on Avatar */}
              {currentUserRole === "owner" && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full p-2 shadow-lg ring-4 ring-background">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              )}
              {currentUserRole === "admin" && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full p-2 shadow-lg ring-4 ring-background">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              )}
            </div>

            {/* Info Principal - Now clearly below the gradient on desktop */}
            <div className="flex-1 text-center sm:text-left space-y-3 w-full sm:pt-16">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{name}</h1>
                  {currentUserRole === "owner" && (
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30 whitespace-nowrap"
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Dono
                    </Badge>
                  )}
                  {currentUserRole === "admin" && (
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {/* Total Members */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Users className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-400">
                    {stats?.total_members || 0} membro{stats?.total_members !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Total Workouts */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-400">{stats?.total_workouts} treinos</span>
                </div>

                {/* Total Meals */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Utensils className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-400">{stats?.total_meals} refeições</span>
                </div>

                {/* Mean Streak */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-400">
                    {stats?.mean_streak?.toFixed(1)} dias média
                  </span>
                </div>

                {/* Total Points */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-400">
                    {stats?.total_points?.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} pts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Action Button - Only for owner/admin */}
          {canEdit && (
            <div className="sm:hidden flex justify-center pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 w-full max-w-xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Editar Grupo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && groupId && (
        <EditGroupModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          groupId={groupId}
          currentData={{
            name,
            description,
            photo: avatar || null,
          }}
        />
      )}
    </>
  );
};

export default GroupCardHeader;
