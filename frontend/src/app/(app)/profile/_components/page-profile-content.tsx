import ProfileCardHeader from "./profile-card-header";
import CardStreakWorkout from "./card-streak-workout";
import CardStreakMeal from "./card-streak-meal";
import GroupListCard from "../group-list-card";
import { ProfileWithUser } from "@/lib/api/profiles";
import CardAwards from "./card-awards";
import ProfileStatistics from "./profile-statistics";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutDashboard, Dumbbell, Utensils, MessageCircle } from "lucide-react";
import { TabWorkouts } from "./tab-workouts";
import { TabMeals } from "./tab-meals";
import { TabSocial } from "./tab-social";

interface PageProfileContentProps {
  profile: ProfileWithUser;
  isOwnProfile?: boolean;
}

export default function PageProfileContent({ profile, isOwnProfile = false }: PageProfileContentProps) {
  const userName = `${profile.userData.first_name} ${profile.userData.last_name}`.trim() || profile.userData.username;

  return (
    <>
      {/* Header do Perfil */}
      <ProfileCardHeader
        avatar={profile.photo}
        email={profile.userData.email}
        name={userName}
        level={profile.level}
        current_streak={profile.workout_streak.current_streak}
        showEditButton={isOwnProfile}
        profileId={profile.id}
        height={profile.height}
        weight={profile.weight}
      />

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview" title="Visão Geral">
            <LayoutDashboard className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="workouts" title="Treinos">
            <Dumbbell className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="meals" title="Alimentação">
            <Utensils className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="social" title="Social">
            <MessageCircle className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Estatísticas Principais */}
          <ProfileStatistics
            score={profile.score}
            current_workout_streak={profile.workout_streak.current_streak}
            current_meal_streak={profile.meal_streak.current_streak}
          />

          {/* Sequências (Streaks) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardStreakWorkout workout_streak={profile.workout_streak} />
            <CardStreakMeal meal_streak={profile.meal_streak} />
          </div>

          {/* Conquistas */}
          <CardAwards />

          {/* Grupos */}
          <GroupListCard groups={profile.groups} />
        </TabsContent>

        {/* Treinos */}
        <TabsContent value="workouts" className="mt-4">
          <TabWorkouts userId={profile.user} isOwnProfile={isOwnProfile} />
        </TabsContent>

        {/* Alimentação */}
        <TabsContent value="meals" className="mt-4">
          <TabMeals userId={profile.user} isOwnProfile={isOwnProfile} />
        </TabsContent>

        {/* Social */}
        <TabsContent value="social" className="mt-4">
          <TabSocial userId={profile.user} />
        </TabsContent>
      </Tabs>
    </>
  );
}
