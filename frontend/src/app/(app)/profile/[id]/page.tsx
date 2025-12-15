"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useProfileQuery } from "@/hooks/useProfilesQuery";
import { ProfileSkeleton } from "../profile-skeleton";
import PageProfileContent from "../_components/page-profile-content";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      if (id) {
        setProfileId(id);
      }
    });
  }, [params]);

  const { data: profile, isLoading } = useProfileQuery(profileId);

  if (!profileId) {
    return <div className="text-center text-muted-foreground py-8">ID do perfil não fornecido</div>;
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Perfil não encontrado</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header com botão de voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <PageProfileContent profile={profile} />
    </div>
  );
}
