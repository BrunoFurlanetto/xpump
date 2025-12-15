from datetime import timedelta, datetime, time

from django.utils import timezone
from faker import Faker

from nutrition.models import Meal, MealConfig
from workouts.models import WorkoutCheckin
from social_feed.models import Post, Comment, PostLike, CommentLike
from .base import SocialFeedBaseTestCase

fake = Faker('pt_BR')


class SignalTest(SocialFeedBaseTestCase):
    """Testes para os signals do social feed."""

    def test_workout_checkin_creates_post(self):
        """Teste que signal cria post quando WorkoutCheckin é salvo."""
        initial_count = Post.objects.count()

        checkin = WorkoutCheckin.objects.create(
            user=self.user1,
            location='Academia Central',
            comments='Treino de peito e tríceps',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        self.assertEqual(Post.objects.count(), initial_count + 1)
        post = Post.objects.filter(workout_checkin=checkin).first()
        self.assertIsNotNone(post)
        self.assertEqual(post.content_type, 'workout')

    def test_workout_checkin_delete_removes_post(self):
        """Teste que signal remove post quando WorkoutCheckin é deletado."""
        checkin = WorkoutCheckin.objects.create(
            user=self.user1,
            location='Academia Central',
            comments='Treino de peito e tríceps',
            workout_date=timezone.now() - timedelta(hours=1),
            duration=timedelta(minutes=60)
        )

        # Verificar que o post foi criado
        post = Post.objects.filter(workout_checkin=checkin).first()
        self.assertIsNotNone(post)
        post_id = post.id

        # Deletar o checkin
        checkin.delete()

        # Verificar que o post foi removido
        self.assertFalse(Post.objects.filter(id=post_id).exists())

    def test_meal_creates_post(self):
        """Teste que signal cria post quando Meal é salvo."""
        meal_config = MealConfig.objects.create(
            meal_name='lunch',
            interval_start=time(hour=12, minute=0),
            interval_end=time(hour=14, minute=0)
        )

        initial_count = Post.objects.count()

        self.meal_data = {
            'user': self.user1,
            'meal_type': meal_config,
            'meal_time': datetime(2025, 8, 27, 13, 30),
            'comments': 'Refeição saudável'
        }

        meal = Meal.objects.create(**self.meal_data)

        self.assertEqual(Post.objects.count(), initial_count + 1)
        post = Post.objects.filter(meal=meal).first()
        self.assertIsNotNone(post)
        self.assertEqual(post.content_type, 'meal')

    def test_meal_delete_removes_post(self):
        """Teste que signal remove post quando Meal é deletado."""
        meal_config = MealConfig.objects.create(
            meal_name='dinner',
            interval_start=time(hour=19, minute=0),
            interval_end=time(hour=21, minute=0)
        )
        self.meal_data = {
            'user': self.user1,
            'meal_type': meal_config,
            'meal_time': datetime(2025, 8, 27, 20, 30),
            'comments': 'Refeição saudável'
        }
        meal = Meal.objects.create(**self.meal_data)

        # Verificar que o post foi criado
        post = Post.objects.filter(meal=meal).first()
        self.assertIsNotNone(post)
        post_id = post.id

        # Deletar a refeição
        meal.delete()

        # Verificar que o post foi removido
        self.assertFalse(Post.objects.filter(id=post_id).exists())

    def test_post_like_updates_counter(self):
        """Teste que signal atualiza contador de likes do post."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        initial_count = post.likes_count

        PostLike.objects.create(user=self.user2, post=post)

        post.refresh_from_db()
        self.assertEqual(post.likes_count, initial_count + 1)

    def test_post_like_delete_updates_counter(self):
        """Teste que signal atualiza contador quando like é removido."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        like = PostLike.objects.create(user=self.user2, post=post)
        post.refresh_from_db()
        initial_count = post.likes_count

        like.delete()

        post.refresh_from_db()
        self.assertEqual(post.likes_count, initial_count - 1)

    def test_comment_like_updates_counter(self):
        """Teste que signal atualiza contador de likes do comentário."""
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

        initial_count = comment.likes_count

        CommentLike.objects.create(user=self.user2, comment=comment)

        comment.refresh_from_db()
        self.assertEqual(comment.likes_count, initial_count + 1)

    def test_comment_like_delete_updates_counter(self):
        """Teste que signal atualiza contador quando like em comentário é removido."""
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

        like = CommentLike.objects.create(user=self.user2, comment=comment)
        comment.refresh_from_db()
        initial_count = comment.likes_count

        like.delete()

        comment.refresh_from_db()
        self.assertEqual(comment.likes_count, initial_count - 1)

    def test_comment_updates_post_counter(self):
        """Teste que signal atualiza contador de comentários do post."""
        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        initial_count = post.comments_count

        Comment.objects.create(
            user=self.user2,
            post=post,
            text=fake.sentence()
        )

        post.refresh_from_db()
        self.assertEqual(post.comments_count, initial_count + 1)

    def test_comment_delete_updates_post_counter(self):
        """Teste que signal atualiza contador quando comentário é removido."""
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

        post.refresh_from_db()
        initial_count = post.comments_count

        comment.delete()

        post.refresh_from_db()
        self.assertEqual(post.comments_count, initial_count - 1)
