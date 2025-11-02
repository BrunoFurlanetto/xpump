# python
from datetime import timedelta, datetime
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Sum, Count, Q, FloatField
from django.db.models.functions import Coalesce


def compute_group_members_data(group, period):
    """
    Retorna dict com dados do grupo e lista de membros (somente pending=False)
    ordenados por pontos no período ('week' | 'month').
    """
    now = timezone.now()

    if period == 'week':
        days_to_subtract = (now.weekday() + 1) % 7
        start_dt = (now - timedelta(days=days_to_subtract)).replace(hour=0, minute=0, second=0, microsecond=0)
        start = start_dt
    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValidationError('Period must be "week" or "month"')

    base_qs = (
        group.groupmembers_set
        .select_related('member', 'member__profile')
        .filter(pending=False)
    )

    qs = base_qs.annotate(
        workout_points=Coalesce(
            Sum(f'member__workouts__base_points', filter=Q(member__workouts__workout_date__gte=start)),
            0.0,
            output_field=FloatField()
        ),
        meal_points=Coalesce(
            Sum(f'member__meals__base_points', filter=Q(member__meals__meal_time__gte=start)),
            0.0,
            output_field=FloatField()
        ),
        workouts_count=Count('member__workouts', filter=Q(member__workouts__workout_date__gte=start)),
        meals_count=Count('member__meals', filter=Q(member__meals__meal_time__gte=start)),
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
            "email": m.member.email,
            "is_admin": m.is_admin,
            "joined_at": m.joined_at,
            "pending": m.pending,
            "position": pos,
            "score": score,
            "workouts": workouts,
            "meals": meals,
        })
        pos += 1

    group_data = {
        "id": group.id,
        "name": getattr(group, "name", None),
        "members": result,
    }

    return group_data
