"use client";

import { getCurrentUser } from "../_actions/getCurrentUser";
import { useProfileQuery } from "@/hooks/useProfilesQuery";
import { useEffect, useState } from "react";
import { ProfileSkeleton } from "./profile-skeleton";
import PageProfileContent from "./_components/page-profile-content";

// Mock data - em um app real, isso viria de uma API

export interface User {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const { data: profile, isLoading } = useProfileQuery(user?.profile_id || null);

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (userData) {
        setUser(userData);
      }
    });
  }, []);

  if (isLoading || !profile) return <ProfileSkeleton />;
  if (!user) return <div className="text-center text-muted-foreground py-8">Usuário não encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageProfileContent profile={profile} isOwnProfile={true} />
    </div>
  );
}
