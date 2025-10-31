import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Flame, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ProfileCardHeader = ({
  name,
  email,
  avatar,
  current_streak,
  level,
}: {
  name: string;
  email: string;
  avatar: string | null;
  current_streak: number;
  level: number;
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 p-6 rounded-lg border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
      <Avatar className="h-20 w-20 ring-2 ring-white/20">
        {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <User className="h-10 w-10" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">{name}</h1>
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 whitespace-nowrap">
            Nível {level}
          </Badge>
        </div>
        <p className="text-muted-foreground">{email}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            {current_streak} em sequência
          </span>
        </div>
      </div>

      {/* <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Notificações
        </Button>
      </div> */}
    </div>
  );
};

export default ProfileCardHeader;
