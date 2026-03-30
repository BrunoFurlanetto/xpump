from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from clients.models import Client
from gamification.models import GamificationBonus, GamificationPenalty, Season
from groups.models import Group, GroupMembers
from groups.services import compute_group_members_data
from nutrition.models import Meal, MealConfig
from profiles.models import Profile
from workouts.models import WorkoutCheckin


class ComputeGroupMembersDataAdjustmentsTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', password='pass')
        self.member = User.objects.create_user(username='member', password='pass')

        self.client_obj = Client.objects.create(
            name='Client Test',
            cnpj='12.345.678/0001-90',
            owners=self.owner,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        Season.objects.create(
            name='Current Season',
            start_date=timezone.now().date() - timedelta(days=30),
            end_date=timezone.now().date() + timedelta(days=30),
            client=self.client_obj,
        )

        self.owner_profile = Profile.objects.create(user=self.owner, employer=self.client_obj)
        self.member_profile = Profile.objects.create(user=self.member, employer=self.client_obj)

        self.group = Group.objects.create(
            name='Group A',
            description='Test group',
            created_by=self.owner,
            owner=self.owner,
        )

        GroupMembers.objects.create(group=self.group, member=self.owner, pending=False, is_admin=True)
        GroupMembers.objects.create(group=self.group, member=self.member, pending=False, is_admin=False)

        self.owner_profile.groups.add(self.group)
        self.member_profile.groups.add(self.group)

        self.meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=timezone.datetime(2026, 1, 1, 6, 0).time(),
            interval_end=timezone.datetime(2026, 1, 1, 9, 0).time(),
            description='Breakfast window',
        )

    def test_compute_group_members_data_includes_adjustments_on_score(self):
        now = timezone.now()

        workout = WorkoutCheckin.objects.create(
            user=self.member,
            workout_date=now,
            duration=timedelta(minutes=45),
            comments='Workout',
        )
        WorkoutCheckin.objects.filter(pk=workout.pk).update(base_points=5.0)

        meal = Meal.objects.create(
            user=self.member,
            meal_type=self.meal_config,
            meal_time=now,
            comments='Meal',
        )
        Meal.objects.filter(pk=meal.pk).update(base_points=2.0)

        # Out-of-window workout should not affect current month aggregations.
        old_workout = WorkoutCheckin.objects.create(
            user=self.member,
            workout_date=now - timedelta(days=40),
            duration=timedelta(minutes=30),
            comments='Old workout',
        )
        WorkoutCheckin.objects.filter(pk=old_workout.pk).update(base_points=9.0)

        GamificationBonus.objects.create(
            created_by=self.owner,
            score=3.0,
            content_object=workout,
            reason='Great effort',
        )
        GamificationPenalty.objects.create(
            created_by=self.owner,
            score=1.0,
            content_object=meal,
            reason='Late logging',
        )

        # This adjustment points to an out-of-window object and must be ignored.
        GamificationBonus.objects.create(
            created_by=self.owner,
            score=10.0,
            content_object=old_workout,
            reason='Old bonus',
        )

        data = compute_group_members_data(self.group)
        members = data['members']

        member_payload = next(item for item in members if item['id'] == self.member.id)

        self.assertEqual(member_payload['workouts'], 5.0)
        self.assertEqual(member_payload['meals'], 2.0)
        self.assertEqual(member_payload['adjustments']['total_bonus'], 3.0)
        self.assertEqual(member_payload['adjustments']['total_penalty'], 1.0)
        self.assertEqual(member_payload['score'], 9.0)

        self.assertEqual(len(member_payload['adjustments']['bonus_list']), 1)
        self.assertEqual(len(member_payload['adjustments']['penalties_list']), 1)
        self.assertEqual(member_payload['adjustments']['bonus_list'][0]['readon'], 'Great effort')
        self.assertEqual(member_payload['adjustments']['penalties_list'][0]['readon'], 'Late logging')
