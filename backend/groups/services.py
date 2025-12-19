# python
from datetime import timedelta
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count, Q, FloatField, FilteredRelation, Prefetch
from django.db.models.functions import Coalesce

from groups.models import GroupMembers, Group


def create_group_for_client(client, *, name, owner, created_by, photo=None, description=None, main=False, members_list=None, add_creator=True):
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

    qs = (
        base_qs
        .annotate(
            meals_rel=FilteredRelation('member__meals', condition=Q(member__meals__meal_time__gte=start)),
            workouts_rel=FilteredRelation('member__workouts', condition=Q(member__workouts__workout_date__gte=start)),
        )
        .annotate(
            meal_points=Coalesce(Sum('meals_rel__base_points'), 0.0, output_field=FloatField()),
            workout_points=Coalesce(Sum('workouts_rel__base_points'), 0.0, output_field=FloatField()),
            meals_count=Count('meals_rel'),
            workouts_count=Count('workouts_rel'),
        )
    )
    members = list(qs)
    members.sort(key=lambda m: (m.workout_points or 0) + (m.meal_points or 0), reverse=True)

    result = []
    pos = 1

    for m in members:
        score = (m.workout_points or 0) + (m.meal_points or 0)
        workouts = m.workouts_count or 0
        meals = m.meals_count or 0

        result.append({
            "id": m.member.id,
            "username": m.member.username,
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


# python
def compute_another_groups(main_group):
    group_members = GroupMembers.objects.filter(group=main_group).select_related(
        'member',
        'member__profile'
    ).prefetch_related(
        Prefetch(
            'member__groupmembers_set',
            queryset=GroupMembers.objects.select_related('group', 'group__created_by').filter(pending=False),
            to_attr='other_groups_memberships'
        )
    )

    groups_info = {}
    gids = set()

    for gm in group_members:
        for member_gm in getattr(gm.member, 'other_groups_memberships', []):
            if member_gm.group_id == main_group.id:
                continue
            gid = member_gm.group_id
            if gid in groups_info:
                continue
            groups_info[gid] = {
                'name': member_gm.group.name,
                'owner': getattr(member_gm.group.created_by, 'get_full_name', lambda: '')(),
            }
            gids.add(gid)

    if not gids:
        return []

    aggs = (
        GroupMembers.objects
        .filter(group_id__in=gids, pending=False)
        .values('group_id')
        .annotate(
            n_members=Count('member', distinct=True),
            pts=Coalesce(Sum('member__profile__score'), 0.0, output_field=FloatField()),
        )
    )

    agg_map = {a['group_id']: a for a in aggs}

    other_groups = []
    for gid, info in groups_info.items():
        a = agg_map.get(gid, {})
        other_groups.append({
            'id': gid,
            'name': info['name'],
            'owner': info['owner'],
            'pts': float(a.get('pts') or 0.0),
            'n_members': int(a.get('n_members') or 0),
        })

    return other_groups

