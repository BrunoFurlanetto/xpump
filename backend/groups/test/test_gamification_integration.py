from datetime import datetime, timedelta, date
from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock

from django.utils import timezone

from groups.models import Group, GroupMembers
from profiles.models import Profile
from clients.models import Client
from gamification.models import GamificationSettings, Season
from gamification.services import Gamification


class GroupRankingTest(TestCase):
    """Test cases for group ranking functionality that remains in groups app"""

    def setUp(self):
        # Create users with different scores
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
        self.user3 = User.objects.create_user(username='user3', password='pass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user1,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.season = Season.objects.create(
            name='Season 1',
            start_date=timezone.now() - timedelta(days=180),
            end_date=timezone.now() + timedelta(days=180),
            client=self.client_obj
        )

        # Create profiles with different scores
        self.profile1 = Profile.objects.create(user=self.user1, score=100, level=1, employer=self.client_obj)
        self.profile2 = Profile.objects.create(user=self.user2, score=200, level=2, employer=self.client_obj)
        self.profile3 = Profile.objects.create(user=self.user3, score=150, level=1, employer=self.client_obj)

        # Create group
        self.group = Group.objects.create(
            name="Test Group",
            created_by=self.user1,
            owner=self.user1,
            main=True
        )

        # Add members to group
        GroupMembers.objects.filter(group=self.group, member=self.user1).update(pending=False)
        GroupMembers.objects.create(group=self.group, member=self.user2, pending=False)
        GroupMembers.objects.create(group=self.group, member=self.user3, pending=False)

        # Add groups to profiles
        self.profile1.groups.add(self.group)
        self.profile2.groups.add(self.group)
        self.profile3.groups.add(self.group)

    def test_group_rank_ordering(self):
        """Test that group ranking returns users ordered by score descending"""
        ranking = self.group.rank()

        # Should be ordered: user2 (200), user3 (150), user1 (100)
        self.assertEqual(len(ranking), 3)
        self.assertEqual(ranking[0][0], self.user2)  # Highest score first
        self.assertEqual(ranking[0][1], 200)
        self.assertEqual(ranking[1][0], self.user3)  # Second highest
        self.assertEqual(ranking[1][1], 150)
        self.assertEqual(ranking[2][0], self.user1)  # Lowest score
        self.assertEqual(ranking[2][1], 100)

    def test_group_user_position(self):
        """Test getting specific user position in group ranking"""
        # user2 should be 1st (highest score: 200)
        self.assertEqual(self.group.user_position(self.user2), 1)

        # user3 should be 2nd (score: 150)
        self.assertEqual(self.group.user_position(self.user3), 2)

        # user1 should be 3rd (lowest score: 100)
        self.assertEqual(self.group.user_position(self.user1), 3)

    def test_group_user_position_not_member(self):
        """Test user position for non-member returns None"""
        non_member = User.objects.create_user(username='nonmember', password='pass')
        Profile.objects.create(user=non_member, score=50, employer=self.client_obj)

        self.assertIsNone(self.group.user_position(non_member))

    def test_group_points_first_place(self):
        """Test getting points of first place user"""
        first_place_points = self.group.points_first_place()
        self.assertEqual(first_place_points, 200)  # user2's score

    def test_group_points_first_place_empty_group(self):
        """Test points_first_place returns 0 for empty group"""
        empty_group = Group.objects.create(
            name="Empty Group",
            created_by=self.user1,
            owner=self.user1
        )
        # Remove default member
        GroupMembers.objects.filter(group=empty_group).delete()

        self.assertEqual(empty_group.points_first_place(), 0)

    def test_group_member_count(self):
        """Test group member count excludes pending members"""
        self.assertEqual(self.group.member_count(), 3)

        # Add pending member
        user4 = User.objects.create_user(username='user4', password='pass')
        GroupMembers.objects.create(group=self.group, member=user4, pending=True)

        # Should still be 3 (pending member not counted)
        self.assertEqual(self.group.member_count(), 3)

    def test_group_rank_excludes_pending_members(self):
        """Test that ranking excludes pending members"""
        # Add pending member with high score
        user4 = User.objects.create_user(username='user4', password='pass')
        Profile.objects.create(user=user4, score=300, level=3, employer=self.client_obj)
        GroupMembers.objects.create(group=self.group, member=user4, pending=True)

        ranking = self.group.rank()

        # Should still be 3 members (pending member excluded)
        self.assertEqual(len(ranking), 3)
        # First place should still be user2 with 200 points
        self.assertEqual(ranking[0][1], 200)


class GamificationIntegrationWithGroupsTest(TestCase):
    """Integration tests between gamification and groups functionality"""

    def setUp(self):
        self.settings = GamificationSettings.objects.create()

        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')

        self.client_obj = Client.objects.create(
            name='Test Client',
            cnpj='12.345.678/0001-90',
            owners=self.user1,
            contact_email='contato@cliente.test',
            phone='(11)99999-9999',
            address='Rua Exemplo, 123, Bairro, Cidade - SP',
        )

        self.profile1 = Profile.objects.create(user=self.user1, score=100, level=1, employer=self.client_obj)
        self.profile2 = Profile.objects.create(user=self.user2, score=300, level=2, employer=self.client_obj)

        self.group = Group.objects.create(
            name="Test Group",
            created_by=self.user1,
            owner=self.user1,
            main=True
        )

        # Add members
        GroupMembers.objects.filter(group=self.group, member=self.user1).update(pending=False)
        GroupMembers.objects.create(group=self.group, member=self.user2, pending=False)

        self.profile1.groups.add(self.group)
        self.profile2.groups.add(self.group)

        # Create season
        self.season = Season.objects.create(
            client=self.client_obj,
            name="Test Season",
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() + timedelta(days=30)
        )

        self.gamification = Gamification()

    @patch('gamification.services.datetime')
    def test_season_bonus_integration_with_group_ranking(self, mock_datetime):
        """Test that season bonus works correctly with group ranking"""
        # Mock datetime to simulate near season end
        mock_datetime.today.return_value.date.return_value = self.season.end_date - timedelta(days=30)

        # user1 has 100 points, user2 has 300 points (first place)
        # user1 should be below 60% of first place (300 * 0.6 = 180)
        # So user1 should receive bonus

        first_place_points = self.group.points_first_place()
        self.assertEqual(first_place_points, 300)

        threshold = first_place_points * (self.settings.percentage_from_first_position / 100)
        self.assertEqual(threshold, 180.0)

        # user1 (100 points) is below threshold, should get bonus
        self.assertLess(self.user1.profile.score, threshold)

        # user2 (300 points) is above threshold, should not get bonus
        self.assertGreaterEqual(self.user2.profile.score, threshold)

    def test_gamification_xp_updates_group_ranking(self):
        """Test that adding XP through gamification updates group ranking"""
        # Initial ranking: user2 (300), user1 (100)
        initial_ranking = self.group.rank()
        self.assertEqual(initial_ranking[0][0], self.user2)
        self.assertEqual(initial_ranking[1][0], self.user1)

        # Add enough XP to user1 to surpass user2
        self.gamification.add_xp(self.user1, 250)  # 100 + 250 = 350

        # New ranking should have user1 first
        new_ranking = self.group.rank()
        self.assertEqual(new_ranking[0][0], self.user1)
        self.assertEqual(new_ranking[0][1], 350)
        self.assertEqual(new_ranking[1][0], self.user2)
        self.assertEqual(new_ranking[1][1], 300)

    def test_level_up_integration(self):
        """Test that level up works correctly with gamification service"""
        initial_level = self.user1.profile.level
        initial_score = self.user1.profile.score

        # Calculate points needed for next level
        points_needed = self.gamification.points_to_next_level(self.user1)

        # Add enough XP to trigger level up
        self.gamification.add_xp(self.user1, points_needed + 10)

        self.user1.profile.refresh_from_db()
        self.assertGreater(self.user1.profile.level, initial_level)
        self.assertEqual(self.user1.profile.score, initial_score + points_needed + 10)

    def test_multiple_groups_ranking_independence(self):
        """Test that multiple groups maintain independent rankings"""
        # Create second group
        group2 = Group.objects.create(
            name="Second Group",
            created_by=self.user2,
            owner=self.user2
        )

        # Add user1 to second group
        GroupMembers.objects.create(group=group2, member=self.user1, pending=False)
        self.profile1.groups.add(group2)

        # Rankings should be independent
        group1_ranking = self.group.rank()
        group2_ranking = group2.rank()

        # group1 has both users: user2 (300), user1 (100)
        self.assertEqual(len(group1_ranking), 2)
        self.assertEqual(group1_ranking[0][0], self.user2)

        # group2 has both users: user2 (300), user1 (100)
        self.assertEqual(len(group2_ranking), 2)
        self.assertEqual(group2_ranking[0][0], self.user2)

        # Add XP to user1
        self.gamification.add_xp(self.user1, 250)  # Now user1 has 350

        # Both groups should reflect the change
        updated_group1_ranking = self.group.rank()
        updated_group2_ranking = group2.rank()

        self.assertEqual(updated_group1_ranking[0][0], self.user1)  # user1 now first
        self.assertEqual(updated_group2_ranking[0][0], self.user1)  # user1 now first
