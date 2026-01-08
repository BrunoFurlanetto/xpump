"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Settings, User, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";

const ProfileCardHeader = ({
  name,
  email,
  avatar,
  current_streak,
  level,
  showEditButton = false,
  profileId,
  height,
  weight,
}: {
  name: string;
  email: string;
  avatar: string | null;
  current_streak: number;
  level: number;
  showEditButton?: boolean;
  profileId?: number | string;
  height?: number | null;
  weight?: number | null;
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <Card className="border-border overflow-hidden">
        {/* Background Gradient */}
        <div className="h-24 sm:h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

          {/* Action Button - Only visible on desktop in the banner */}
          {showEditButton && (
            <div className="hidden sm:block absolute top-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span>Editar Perfil</span>
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16 sm:-mt-20">
            {/* Avatar com Badge de Nível */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-background border-2 border-border shadow-xl">
                {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                  <User className="h-12 w-12 sm:h-16 sm:w-16" />
                </AvatarFallback>
              </Avatar>

              {/* Level Badge on Avatar */}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full p-2 shadow-lg ring-4 ring-background">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Info Principal - Now clearly below the gradient on desktop */}
            <div className="flex-1 text-center sm:text-left space-y-3 w-full sm:pt-16">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{name}</h1>
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30 whitespace-nowrap"
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Nível {level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {/* Streak */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-400">
                    {current_streak} dia{current_streak !== 1 ? "s" : ""} de sequência
                  </span>
                </div>

                {/* Level Progress Indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-400">Em progresso</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Action Button */}
          {showEditButton && (
            <div className="sm:hidden flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 w-full max-w-xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Editar Perfil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showEditButton && profileId && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profileId={profileId}
          currentData={{
            photo: avatar,
            height: height || null,
            weight: weight || null,
            name,
          }}
        />
      )}
    </>
  );
};

export default ProfileCardHeader;
