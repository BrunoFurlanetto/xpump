# python
from datetime import timedelta

from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count, Q, FloatField, FilteredRelation, Prefetch, OuterRef, Value, Subquery, \
    IntegerField
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


def compute_group_members_data(group, period):
    """
    Retorna dict com dados do grupo e lista de membros (somente pending=False)
    ordenados por pontos no período ('week' | 'month').
    """
    # obtém modelos (ajuste 'meals' e 'workouts' se seus app labels forem diferentes)
    Meal = apps.get_model('meals', 'Meal')
    Workout = apps.get_model('workouts', 'Workout')

    now = timezone.now()
    local_now = timezone.localtime(now)

    if period == 'week':
        days_to_subtract = (local_now.weekday() + 1) % 7
        start_dt = (local_now - timedelta(days=days_to_subtract)).replace(hour=0, minute=0, second=0, microsecond=0)
        start = start_dt
    elif period == 'month':
        start = local_now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValidationError('Period must be "week" or "month"')

    base_qs = (
        group.groupmembers_set
        .select_related('member', 'member__profile')
        .filter(pending=False)
    )

    # subqueries por membro (retornam um único valor)
    meals_pts_sq = (
        Meal.objects.filter(member=OuterRef('member'), meal_time__gte=start)
        .values('member')
        .annotate(pts=Coalesce(Sum('base_points'), Value(0.0)))
        .values('pts')
    )
    meals_count_sq = (
        Meal.objects.filter(member=OuterRef('member'), meal_time__gte=start)
        .values('member')
        .annotate(cnt=Count('id'))
        .values('cnt')
    )

    workouts_pts_sq = (
        Workout.objects.filter(member=OuterRef('member'), workout_date__gte=start)
        .values('member')
        .annotate(pts=Coalesce(Sum('base_points'), Value(0.0)))
        .values('pts')
    )
    workouts_count_sq = (
        Workout.objects.filter(member=OuterRef('member'), workout_date__gte=start)
        .values('member')
        .annotate(cnt=Count('id'))
        .values('cnt')
    )

    qs = (
        base_qs
        .annotate(
            meal_points=Coalesce(Subquery(meals_pts_sq, output_field=FloatField()), 0.0),
            meals_count=Coalesce(Subquery(meals_count_sq, output_field=IntegerField()), 0),
            workout_points=Coalesce(Subquery(workouts_pts_sq, output_field=FloatField()), 0.0),
            workouts_count=Coalesce(Subquery(workouts_count_sq, output_field=IntegerField()), 0),
        )
    )

    members = list(qs)
    members.sort(key=lambda m: (m.workout_points or 0) + (m.meal_points or 0), reverse=True)

    # resto do código permanece igual...
    result = []
    pos = 1

    for m in members:
        score = (m.workout_points or 0) + (m.meal_points or 0)
        workouts = m.workouts_count or 0
        meals = m.meals_count or 0

        result.append({
            "id": m.member.id,
            "username": m.member.username,
            "photo": m.member.profile.photo.url if hasattr(m.member, 'profile') and m.member.profile.photo else None,
            "full_name": m.member.get_full_name(),
            "email": m.member.email,
            "is_admin": m.is_admin,
            "joined_at": m.joined_at,
            "pending": m.pending,
            "position": pos,
            "score": score,
            "workouts": workouts,
            "meals": meals,
            "profile_id": getattr(getattr(m.member, 'profile', None), 'id', None),
        })
        pos += 1

    group_data = {
        "id": group.id,
        "name": getattr(group, "name", None),
        "members": result,
    }

    return group_data
    # now = timezone.now()
    # local_now = timezone.localtime(now)
    #
    # if period == 'week':
    #     days_to_subtract = (local_now.weekday() + 1) % 7
    #     start_dt = (local_now - timedelta(days=days_to_subtract)).replace(hour=0, minute=0, second=0, microsecond=0)
    #     start = start_dt
    # elif period == 'month':
    #     start = local_now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # else:
    #     raise ValidationError('Period must be "week" or "month"')
    #
    # base_qs = (
    #     group.groupmembers_set
    #     .select_related('member', 'member__profile')
    #     .filter(pending=False)
    # )
    #
    # qs = (
    #     base_qs
    #     .annotate(
    #         meals_rel=FilteredRelation('member__meals', condition=Q(member__meals__meal_time__gte=start)),
    #         workouts_rel=FilteredRelation('member__workouts', condition=Q(member__workouts__workout_date__gte=start)),
    #     )
    #     .annotate(
    #         meal_points=Coalesce(Sum('meals_rel__base_points'), 0.0, output_field=FloatField()),
    #         workout_points=Coalesce(Sum('workouts_rel__base_points'), 0.0, output_field=FloatField()),
    #         meals_count=Count('meals_rel'),
    #         workouts_count=Count('workouts_rel'),
    #     )
    # )
    # members = list(qs)
    # members.sort(key=lambda m: (m.workout_points or 0) + (m.meal_points or 0), reverse=True)
    #
    # result = []
    # pos = 1
    #
    # for m in members:
    #     score = (m.workout_points or 0) + (m.meal_points or 0)
    #     workouts = m.workouts_count or 0
    #     meals = m.meals_count or 0
    #
    #     result.append({
    #         "id": m.member.id,
    #         "username": m.member.username,
    #         "photo": m.member.profile.photo.url if hasattr(m.member, 'profile') and m.member.profile.photo else None,
    #         "full_name": m.member.get_full_name(),
    #         "email": m.member.email,
    #         "is_admin": m.is_admin,
    #         "joined_at": m.joined_at,
    #         "pending": m.pending,
    #         "position": pos,
    #         "score": score,
    #         "workouts": workouts,
    #         "meals": meals,
    #         "profile_id": getattr(getattr(m.member, 'profile', None), 'id', None),
    #     })
    #     pos += 1
    #
    # group_data = {
    #     "id": group.id,
    #     "name": getattr(group, "name", None),
    #     "members": result,
    # }
    #
    # return group_data


# python
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
