import ProfileCardHeader from "./profile-card-header";
import CardProgressLevel from "./card-progress-level";
import CardStreakWorkout from "./card-streak-workout";
import CardStreakMeal from "./card-streak-meal";
import GroupListCard from "../group-list-card";
import { ProfileWithUser } from "@/lib/api/profiles";
import CardAwards from "./card-awards";
import ProfileStatistics from "./profile-statistics";

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

      {/* Estatísticas Principais */}
      <ProfileStatistics
        score={profile.score}
        current_workout_streak={profile.workout_streak.current_streak}
        current_meal_streak={profile.meal_streak.current_streak}
      />

      {/* Progresso de Level */}
      <CardProgressLevel
        level={profile.level}
        points_to_next_level={profile.points_to_next_level}
        score={profile.score}
      />

      {/* Sequências (Streaks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workout Streak */}
        <CardStreakWorkout workout_streak={profile.workout_streak} />

        {/* Meal Streak */}
        <CardStreakMeal meal_streak={profile.meal_streak} />
      </div>

      {/* Conquistas */}
      <CardAwards />

      {/* Grupos */}
      <GroupListCard groups={profile.groups} />
    </>
  );
}
