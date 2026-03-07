from django.apps import apps
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count, FloatField, OuterRef, Value, Subquery, IntegerField
from django.db.models.functions import Coalesce

from groups.models import GroupMembers, Group


def create_group_for_client(
        client,
        name,
        owner,
        created_by,
        photo=None,
        description='',
        main=False,
        members_list=None,
        add_creator=True,
        add_owner=False,
):
    """
    Create a Group and link it to the client:
    - if main=True: define client.main_group
    - if main=False: add the group to client.groups (ManyToMany)
    - create the records in GroupMembers
    """

    members_list = members_list or []

    with transaction.atomic():
        group = Group.objects.create(
            name=name,
            owner=owner,
            photo=photo,
            description=description,
            created_by=created_by,
            main=main,
        )

        if main:
            client.main_group = group
            client.save(update_fields=['main_group'])
        else:
            client.groups.add(group)

        if add_creator and created_by:
            GroupMembers.objects.create(
                member=created_by,
                group=group,
                is_admin=True,
                pending=False
            )

        if add_owner:
            GroupMembers.objects.create(
                member=owner,
                group=group,
                is_admin=True,
                pending=False
            )

        to_create = [
            GroupMembers(member=member, group=group, pending=False)
            for member in members_list
        ]
        if to_create:
            GroupMembers.objects.bulk_create(to_create)

        return group


def compute_group_members_data(group):
    """
    Retorna membros ativos do grupo com pontuação do mês atual,
    filtrada apenas por registros (WorkoutCheckin / Meal) vinculados
    ao grupo via M2M. Também retorna estatísticas agregadas.

    Retorno:
        {
            "members": [ ... ],
            "stats": { ... },
        }
    """
    Meal = apps.get_model('nutrition', 'Meal')
    Workout = apps.get_model('workouts', 'WorkoutCheckin')

    month_start = timezone.localtime(timezone.now()).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0,
    )

    base_qs = (
        group.groupmembers_set
        .select_related('member', 'member__profile',
                        'member__workout_streak', 'member__meal_streak')
        .filter(pending=False)
    )

    # Subqueries: pontos e contagens do mês atual, filtrados pelo grupo
    workouts_pts_sq = (
        Workout.objects.filter(
            user=OuterRef('member'),
            groups=group,
            workout_date__gte=month_start,
        )
        .values('user')
        .annotate(pts=Coalesce(Sum('base_points'), Value(0.0)))
        .values('pts')
    )

    workouts_count_sq = (
        Workout.objects.filter(
            user=OuterRef('member'),
            groups=group,
            workout_date__gte=month_start,
        )
        .values('user')
        .annotate(cnt=Count('id'))
        .values('cnt')
    )

    meals_pts_sq = (
        Meal.objects.filter(
            user=OuterRef('member'),
            groups=group,
            meal_time__gte=month_start,
        )
        .values('user')
        .annotate(pts=Coalesce(Sum('base_points'), Value(0.0)))
        .values('pts')
    )

    meals_count_sq = (
        Meal.objects.filter(
            user=OuterRef('member'),
            groups=group,
            meal_time__gte=month_start,
        )
        .values('user')
        .annotate(cnt=Count('id'))
        .values('cnt')
    )

    qs = base_qs.annotate(
        workout_points=Coalesce(Subquery(workouts_pts_sq, output_field=FloatField()), 0.0),
        meal_points=Coalesce(Subquery(meals_pts_sq, output_field=FloatField()), 0.0),
        workouts_count=Coalesce(Subquery(workouts_count_sq, output_field=IntegerField()), 0),
        meals_count=Coalesce(Subquery(meals_count_sq, output_field=IntegerField()), 0),
    )

    members = list(qs)
    members.sort(key=lambda m: (m.workout_points or 0) + (m.meal_points or 0), reverse=True)

    result = []
    prev_score = None
    rank = 0
    total_points = 0
    total_workouts = 0
    total_meals = 0
    workout_streaks = []
    meal_streaks = []

    for idx, m in enumerate(members):
        score = (m.workout_points or 0) + (m.meal_points or 0)
        if score != prev_score:
            rank = idx + 1
            prev_score = score

        total_points += score
        total_workouts += m.workouts_count or 0
        total_meals += m.meals_count or 0

        ws = getattr(m.member, 'workout_streak', None)
        ms = getattr(m.member, 'meal_streak', None)
        if ws is not None:
            workout_streaks.append(ws.current_streak)
        if ms is not None:
            meal_streaks.append(ms.current_streak)

        result.append({
            "id": m.member.id,
            "username": m.member.username,
            "photo": (m.member.profile.photo.url
                      if hasattr(m.member, 'profile') and m.member.profile.photo
                      else None),
            "full_name": m.member.get_full_name(),
            "email": m.member.email,
            "is_admin": m.is_admin,
            "joined_at": m.joined_at,
            "pending": m.pending,
            "position": rank,
            "score": score,
            "workouts": m.workout_points or 0,
            "meals": m.meal_points or 0,
            "profile_id": getattr(getattr(m.member, 'profile', None), 'id', None),
        })

    mw = (sum(workout_streaks) / len(workout_streaks)) if workout_streaks else 0
    mm = (sum(meal_streaks) / len(meal_streaks)) if meal_streaks else 0

    stats = {
        "total_members": len(members),
        "total_points": total_points,
        "total_workouts": total_workouts,
        "total_meals": total_meals,
        "mean_streak": (mw + mm) / 2 if (mw or mm) else 0,
        "mean_workout_streak": mw,
        "mean_meal_streak": mm,
    }

    return {
        "members": result,
        "stats": stats,
    }


def compute_another_groups(main_group):
    client = main_group.client.first()
    groups = list(client.groups.all())

    aggregations = GroupMembers.objects.filter(group__in=groups, pending=False).values('group').annotate(
        members_count=Count('id'),
        members_score_sum=Coalesce(Sum('member__profile__score'), 0.0)
    )

    aggregations_map = {item['group']: item for item in aggregations}
    other_groups = []

    for group in groups:
        data = aggregations_map.get(group.id, {'members_count': 0, 'members_score_sum': 0.0})
        other_groups.append({
            "id": group.id,
            "name": group.name,
            "pts": data['members_score_sum'],
            "n_members": data['members_count'],
        })

    return other_groups
