import tempfile
from datetime import timedelta, datetime, time

from django.test import override_settings
from django.utils import timezone
from faker import Faker

from nutrition.models import Meal, MealConfig
from workouts.models import WorkoutCheckin
from social_feed.models import (
    Post, Comment, PostLike, CommentLike, ContentFilePost, Report
)
from .base import SocialFeedBaseTestCase

fake = Faker('pt_BR')


class PostModelTest(SocialFeedBaseTestCase):
    """Testes para o model Post."""

    def test_create_social_post(self):
        """Teste criação de post social."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text(max_nb_chars=200),
            visibility='global'
        )

        self.assertEqual(post.content_type, 'social')
        self.assertTrue(post.allow_comments)
        self.assertEqual(post.comments_count, 0)
        self.assertEqual(post.likes_count, 0)

    def test_create_workout_post(self):
        """Teste criação de post de workout."""
        workout_checkin = WorkoutCheckin.objects.create(
            user=self.user1,
            location='Academia Central',
            comments='Treino de peito e tríceps',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        post = Post.objects.create(
            user=self.user1,
            content_type='workout',
            workout_checkin=workout_checkin,
            visibility='global'
        )
        self.assertEqual(post.content_type, 'workout')
        self.assertEqual(post.workout_checkin, workout_checkin)
        self.assertIsNone(post.meal)

    def test_create_meal_post(self):
        """Teste criação de post de refeição."""
        meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start=time(8, 0),
            interval_end=time(10, 0)
        )
        self.meal_data = {
            'user': self.user1,
            'meal_type': meal_config,
            'meal_time': datetime(2025, 8, 27, 8, 30),
            'comments': 'Refeição saudável'
        }
        meal = Meal.objects.create(**self.meal_data)

        post = Post.objects.create(
            user=self.user1,
            content_type='meal',
            meal=meal,
            visibility='global'
        )
        self.assertEqual(post.content_type, 'meal')
        self.assertEqual(post.meal, meal)
        self.assertIsNone(post.workout_checkin)

    def test_post_str_method(self):
        """Teste método __str__ do Post."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )
        expected = f"{self.user1.username} - social post - {post.created_at}"
        self.assertEqual(str(post), expected)


class ContentFilePostModelTest(SocialFeedBaseTestCase):
    """Testes para o model ContentFilePost."""

    @override_settings(MEDIA_ROOT=tempfile.gettempdir())
    def test_create_content_file_post(self):
        """Teste criação de arquivo de conteúdo."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        image = self.create_test_image()
        content_file = ContentFilePost.objects.create(
            post=post,
            file=image
        )

        self.assertEqual(content_file.post, post)
        self.assertTrue(content_file.file.name.startswith('post_media/'))
        self.assertIsNotNone(content_file.uploaded_at)

    def test_content_file_str_method(self):
        """Teste método __str__ do ContentFilePost."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )
        content_file = ContentFilePost.objects.create(
            post=post,
            file=self.create_test_image()
        )
        expected = f"File for post {post.id} uploaded at {content_file.uploaded_at}"
        self.assertEqual(str(content_file), expected)


class CommentModelTest(SocialFeedBaseTestCase):
    """Testes para o model Comment."""

    def test_create_comment(self):
        """Teste criação de comentário."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        comment = Comment.objects.create(
            user=self.user2,
            post=post,
            text=fake.sentence()
        )

        self.assertEqual(comment.post, post)
        self.assertEqual(comment.user, self.user2)
        self.assertEqual(comment.likes_count, 0)
        self.assertIsNotNone(comment.created_at)

    def test_comment_str_method(self):
        """Teste método __str__ do Comment."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )
        comment = Comment.objects.create(
            user=self.user2,
            post=post,
            text=fake.sentence()
        )
        expected = f"{self.user2.username} comment on {post.id} - {comment.created_at}"
        self.assertEqual(str(comment), expected)


class PostLikeModelTest(SocialFeedBaseTestCase):
    """Testes para o model PostLike."""

    def test_create_post_like(self):
        """Teste criação de like em post."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        like = PostLike.objects.create(
            user=self.user2,
            post=post
        )

        self.assertEqual(like.post, post)
        self.assertEqual(like.user, self.user2)
        self.assertIsNotNone(like.created_at)

    def test_unique_post_like(self):
        """Teste que não permite like duplicado no mesmo post."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        PostLike.objects.create(user=self.user2, post=post)

        # Tentar criar outro like do mesmo usuário no mesmo post
        with self.assertRaises(Exception):  # IntegrityError
            PostLike.objects.create(user=self.user2, post=post)


class CommentLikeModelTest(SocialFeedBaseTestCase):
    """Testes para o model CommentLike."""

    def test_create_comment_like(self):
        """Teste criação de like em comentário."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )
        comment = Comment.objects.create(
            user=self.user1,
            post=post,
            text=fake.sentence()
        )

        like = CommentLike.objects.create(
            user=self.user2,
            comment=comment
        )

        self.assertEqual(like.comment, comment)
        self.assertEqual(like.user, self.user2)
        self.assertIsNotNone(like.created_at)


class ReportModelTest(SocialFeedBaseTestCase):
    """Testes para o model Report."""

    def test_create_post_report(self):
        """Teste criação de report de post."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        report = Report.objects.create(
            reported_by=self.user2,
            report_type='post',
            post=post,
            reason='spam',
            other_reason='Post suspeito'
        )

        self.assertEqual(report.post, post)
        self.assertEqual(report.reported_by, self.user2)
        self.assertEqual(report.reason, 'spam')
        self.assertEqual(report.status, 'pending')
