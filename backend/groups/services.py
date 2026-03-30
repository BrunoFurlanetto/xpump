from django.apps import apps
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count, FloatField, OuterRef, Value, Subquery, IntegerField, Q
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
    Bonus = apps.get_model('gamification', 'GamificationBonus')
    Penalty = apps.get_model('gamification', 'GamificationPenalty')
    ContentType = apps.get_model('contenttypes', 'ContentType')

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

    member_ids = [member.member_id for member in members]

    def empty_adjustments():
        return {
            "total_bonus": 0.0,
            "total_penalty": 0.0,
            "bonus_list": [],
            "penalties_list": [],
        }

    adjustments_by_member = {
        member_id: empty_adjustments()
        for member_id in member_ids
    }

    workout_items = list(
        Workout.objects.filter(
            user_id__in=member_ids,
            groups=group,
            workout_date__gte=month_start,
        ).values('id', 'user_id')
    )
    meal_items = list(
        Meal.objects.filter(
            user_id__in=member_ids,
            groups=group,
            meal_time__gte=month_start,
        ).values('id', 'user_id')
    )

    workout_owner_map = {item['id']: item['user_id'] for item in workout_items}
    meal_owner_map = {item['id']: item['user_id'] for item in meal_items}
    workout_ids = list(workout_owner_map.keys())
    meal_ids = list(meal_owner_map.keys())

    if workout_ids or meal_ids:
        workout_ct_id = ContentType.objects.get_for_model(Workout).id
        meal_ct_id = ContentType.objects.get_for_model(Meal).id

        filters = Q()
        if workout_ids:
            filters |= Q(content_type_id=workout_ct_id, object_id__in=workout_ids)
        if meal_ids:
            filters |= Q(content_type_id=meal_ct_id, object_id__in=meal_ids)

        bonuses = Bonus.objects.filter(filters).select_related('created_by').order_by('-created_at')
        penalties = Penalty.objects.filter(filters).select_related('created_by').order_by('-created_at')

        def get_owner_id(content_type_id, object_id):
            if content_type_id == workout_ct_id:
                return workout_owner_map.get(object_id)
            if content_type_id == meal_ct_id:
                return meal_owner_map.get(object_id)
            return None

        def get_full_name(user):
            full_name = user.get_full_name().strip()
            return full_name or user.username

        for bonus in bonuses:
            owner_id = get_owner_id(bonus.content_type_id, bonus.object_id)
            if owner_id not in adjustments_by_member:
                continue

            payload = {
                'score': float(bonus.score),
                'created_at': bonus.created_at,
                'created_by': {
                    'id': bonus.created_by_id,
                    'fullname': get_full_name(bonus.created_by),
                },
                'readon': bonus.reason,
            }
            adjustments_by_member[owner_id]['bonus_list'].append(payload)
            adjustments_by_member[owner_id]['total_bonus'] += float(bonus.score)

        for penalty in penalties:
            owner_id = get_owner_id(penalty.content_type_id, penalty.object_id)
            if owner_id not in adjustments_by_member:
                continue

            payload = {
                'score': float(penalty.score),
                'created_at': penalty.created_at,
                'created_by': {
                    'id': penalty.created_by_id,
                    'fullname': get_full_name(penalty.created_by),
                },
                'readon': penalty.reason,
            }
            adjustments_by_member[owner_id]['penalties_list'].append(payload)
            adjustments_by_member[owner_id]['total_penalty'] += float(penalty.score)

    def get_member_score(member):
        adjustments = adjustments_by_member.get(member.member_id, empty_adjustments())
        return (
            float(member.workout_points or 0)
            + float(member.meal_points or 0)
            + float(adjustments['total_bonus'] or 0)
            - float(adjustments['total_penalty'] or 0)
        )

    members.sort(key=get_member_score, reverse=True)

    result = []
    prev_score = None
    rank = 0
    total_points = 0
    total_workouts = 0
    total_meals = 0
    workout_streaks = []
    meal_streaks = []

    for idx, m in enumerate(members):
        adjustments = adjustments_by_member.get(m.member_id, empty_adjustments())
        score = get_member_score(m)
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
            "adjustments": adjustments,
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
