"""
Tests for analytics serializers
"""
from django.test import TestCase
from django.utils import timezone

from analytics.serializer import (
    SystemStatsSerializer,
    UserStatsSerializer,
    GroupStatsSerializer,
    ActivitySerializer,
    UserDetailSerializer,
    GroupDetailSerializer
)


class SystemStatsSerializerTest(TestCase):
    """Test SystemStatsSerializer"""

    def test_serializer_with_valid_data(self):
        """Test serializer with valid system stats data"""
        data = {
            'total_users': 100,
            'active_users': 80,
            'inactive_users': 20,
            'new_users_this_month': 10,
            'new_users_this_week': 5,
            'new_users_today': 2,
            'total_groups': 5,
            'total_clients': 50,
            'active_clients': 40,
            'inactive_clients': 10,
            'new_clients_this_month': 8,
            'new_clients_this_week': 4,
            'new_clients_today': 1,
            'total_workouts': 500,
            'workouts_today': 20,
            'workouts_this_week': 150,
            'workouts_this_month': 300,
            'total_meals': 1000,
            'meals_today': 40,
            'meals_this_week': 280,
            'meals_this_month': 600,
            'total_posts': 200,
            'posts_today': 10,
            'posts_this_week': 50,
            'posts_this_month': 120,
            'total_comments': 300,
            'comments_today': 15,
            'comments_this_week': 80,
            'comments_this_month': 180,
            'total_likes': 400,
            'likes_today': 20,
            'likes_this_week': 100,
            'likes_this_month': 250,
            'pending_reports': 5,
            'average_user_level': 5.5,
            'average_user_score': 1250.75,
            'average_workout_streak': 3.2,
            'average_meal_streak': 4.5,
            'active_seasons': 2
        }

        serializer = SystemStatsSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['total_users'], 100)
        self.assertEqual(serializer.validated_data['active_users'], 80)
        self.assertEqual(serializer.validated_data['average_user_level'], 5.5)

    def test_serializer_fields(self):
        """Test serializer contains all required fields"""
        serializer = SystemStatsSerializer()
        expected_fields = [
            'total_users', 'active_users', 'inactive_users', 'new_users_this_month',
            'new_users_this_week', 'new_users_today', 'total_groups',
            'total_clients', 'active_clients', 'inactive_clients', 'new_clients_this_month',
            'new_clients_this_week', 'new_clients_today',
            'total_workouts', 'workouts_today', 'workouts_this_week',
            'workouts_this_month', 'total_meals', 'meals_today', 'meals_this_week',
            'meals_this_month', 'total_posts', 'posts_today', 'posts_this_week', 'posts_this_month',
            'total_comments', 'comments_today', 'comments_this_week', 'comments_this_month',
            'total_likes', 'likes_today', 'likes_this_week', 'likes_this_month',
            'pending_reports', 'average_user_level',
            'average_user_score', 'average_workout_streak', 'average_meal_streak',
            'active_seasons'
        ]

        for field in expected_fields:
            self.assertIn(field, serializer.fields)


class UserStatsSerializerTest(TestCase):
    """Test UserStatsSerializer"""

    def test_serializer_with_valid_data(self):
        """Test serializer with valid user stats data"""
        now = timezone.now()
        data = {
            'id': 1,
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'date_joined': now,
            'profile_score': 1500.0,
            'profile_level': 7,
            'workout_count': 50,
            'meal_count': 100,
            'post_count': 20,
            'current_workout_streak': 5,
            'longest_workout_streak': 10,
            'current_meal_streak': 7,
            'longest_meal_streak': 15,
            'last_activity': now,
            'is_active': True,
            'group_count': 3
        }

        serializer = UserStatsSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['username'], 'testuser')
        self.assertEqual(serializer.validated_data['workout_count'], 50)
        self.assertEqual(serializer.validated_data['current_workout_streak'], 5)


class GroupStatsSerializerTest(TestCase):
    """Test GroupStatsSerializer"""

    def test_serializer_with_valid_data(self):
        """Test serializer with valid group stats data"""
        now = timezone.now()
        data = {
            'id': 1,
            'name': 'Test Group',
            'description': 'A test group',
            'created_at': now,
            'created_by': 'admin',
            'owner': 'admin',
            'is_main': False,
            'member_count': 25,
            'active_members_today': 10,
            'active_members_this_week': 20,
            'total_workouts': 200,
            'total_meals': 400,
            'workouts_this_week': 30,
            'meals_this_week': 60,
            'top_performer_username': 'topuser',
            'top_performer_score': 2500.0
        }

        serializer = GroupStatsSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'Test Group')
        self.assertEqual(serializer.validated_data['member_count'], 25)
        self.assertEqual(serializer.validated_data['active_members_today'], 10)


class ActivitySerializerTest(TestCase):
    """Test ActivitySerializer"""

    def test_serializer_with_workout_activity(self):
        """Test serializer with workout activity data"""
        now = timezone.now()
        data = {
            'id': 1,
            'type': 'workout',
            'user_id': 1,
            'user_name': 'Test User',
            'description': 'Registrou um treino de 60 minutos',
            'timestamp': now,
            'related_id': 1,
            'details': {
                'duration': 60,
                'location': 'gym',
                'points': 100
            }
        }

        serializer = ActivitySerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['type'], 'workout')
        self.assertEqual(serializer.validated_data['user_name'], 'Test User')
        self.assertEqual(serializer.validated_data['details']['duration'], 60)

    def test_serializer_with_meal_activity(self):
        """Test serializer with meal activity data"""
        now = timezone.now()
        data = {
            'id': 2,
            'type': 'meal',
            'user_id': 1,
            'user_name': 'Test User',
            'description': 'Registrou Café da manhã',
            'timestamp': now,
            'related_id': 2,
            'details': {
                'meal_type': 'breakfast',
                'points': 50
            }
        }

        serializer = ActivitySerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['type'], 'meal')


class UserDetailSerializerTest(TestCase):
    """Test UserDetailSerializer"""

    def test_serializer_with_complete_data(self):
        """Test serializer with complete user detail data"""
        now = timezone.now()
        data = {
            'id': 1,
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'date_joined': now,
            'profile_score': 1500.0,
            'profile_level': 7,
            'height': 175,
            'weight': 70,
            'workout_count': 50,
            'meal_count': 100,
            'post_count': 20,
            'comment_count': 30,
            'current_workout_streak': 5,
            'longest_workout_streak': 10,
            'current_meal_streak': 7,
            'longest_meal_streak': 15,
            'workout_frequency': 4,
            'last_workout': now,
            'last_meal': now,
            'last_post': now,
            'last_activity': now,
            'is_active': True,
            'groups': [
                {'id': 1, 'name': 'Group 1', 'is_admin': False, 'joined_at': now}
            ],
            'employer_name': 'Test Company'
        }

        serializer = UserDetailSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['username'], 'testuser')
        self.assertEqual(serializer.validated_data['height'], 175)
        self.assertEqual(len(serializer.validated_data['groups']), 1)


class GroupDetailSerializerTest(TestCase):
    """Test GroupDetailSerializer"""

    def test_serializer_with_complete_data(self):
        """Test serializer with complete group detail data"""
        now = timezone.now()
        data = {
            'id': 1,
            'name': 'Test Group',
            'description': 'A test group',
            'created_at': now,
            'created_by': 'admin',
            'owner': 'admin',
            'is_main': False,
            'member_count': 25,
            'admin_count': 3,
            'pending_members': 2,
            'total_workouts': 500,
            'total_meals': 1000,
            'total_posts': 100,
            'workouts_today': 10,
            'workouts_this_week': 50,
            'workouts_this_month': 200,
            'meals_today': 20,
            'meals_this_week': 100,
            'meals_this_month': 400,
            'active_members_today': 15,
            'active_members_this_week': 20,
            'active_members_this_month': 23,
            'top_members': [
                {'rank': 1, 'user_id': 1, 'username': 'user1', 'full_name': 'User One', 'score': 3000.0, 'level': 10}
            ]
        }

        serializer = GroupDetailSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'Test Group')
        self.assertEqual(serializer.validated_data['member_count'], 25)
        self.assertEqual(len(serializer.validated_data['top_members']), 1)

