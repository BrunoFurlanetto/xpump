from faker import Faker
from django.test import TestCase
from django.contrib.auth.models import User

from social_feed.serializers import (
    PostCreateSerializer, PostSerializer, CommentSerializer,
    ReportCreateSerializer
)
from social_feed.models import Post, Comment
from status.models import Status

fake = Faker('pt_BR')


class SerializerTest(TestCase):
    """Testes para serializers."""

    def setUp(self):
        """Setup básico para testes de serializers."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )

        # Criar Status necessários
        Status.objects.get_or_create(
            app_name='POST',
            action='PUBLISHED',
            is_active=True,
            defaults={'name': 'Publicado'}
        )
        Status.objects.get_or_create(
            app_name='COMMENT',
            action='PUBLISHED',
            is_active=True,
            defaults={'name': 'Publicado'}
        )

    def test_post_create_serializer_valid_data(self):
        """Teste validação do PostCreateSerializer com dados válidos."""
        valid_data = {
            'content_type': 'social',
            'content_text': fake.text(max_nb_chars=200),
            'visibility': 'global',
            'allow_comments': True
        }

        serializer = PostCreateSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

        # Verificar dados validados
        self.assertEqual(serializer.validated_data['content_type'], 'social')
        self.assertEqual(serializer.validated_data['visibility'], 'global')
        self.assertTrue(serializer.validated_data['allow_comments'])

    def test_post_create_serializer_invalid_social_post(self):
        """Teste validação de post social sem conteúdo."""
        invalid_data = {
            'content_type': 'social',
            'visibility': 'global'
            # Faltando content_text e files
        }

        serializer = PostCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('content_text or files is required', str(serializer.errors))

    def test_post_create_serializer_workout_validation(self):
        """Teste validação de post de workout."""
        # Post de workout sem workout_checkin
        invalid_data = {
            'content_type': 'workout',
            'visibility': 'global'
        }

        serializer = PostCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('workout_checkin is required', str(serializer.errors))

    def test_post_create_serializer_meal_validation(self):
        """Teste validação de post de refeição."""
        # Post de meal sem meal
        invalid_data = {
            'content_type': 'meal',
            'visibility': 'global'
        }

        serializer = PostCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('meal is required', str(serializer.errors))

    def test_post_create_serializer_mixed_content_validation(self):
        """Teste validação para evitar conteúdo misto."""
        # Post de workout com conteúdo social
        invalid_data = {
            'content_type': 'workout',
            'content_text': fake.text(),
            'visibility': 'global'
        }

        serializer = PostCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('workout_checkin is required for workout posts', str(serializer.errors))

    def test_post_serializer_read(self):
        """Teste leitura de post com PostSerializer."""
        post = Post.objects.create(
            user=self.user,
            content_type='social',
            content_text=fake.text(),
            visibility='global'
        )

        serializer = PostSerializer(post)
        data = serializer.data

        self.assertEqual(data['id'], post.id)
        self.assertEqual(data['content_type'], 'social')
        self.assertEqual(data['visibility'], 'global')
        self.assertIn('user', data)
        self.assertIn('comments', data)
        self.assertIn('likes', data)
        self.assertIn('content_files', data)

    def test_comment_serializer_read(self):
        """Teste leitura de comentário com CommentSerializer."""
        post = Post.objects.create(
            user=self.user,
            content_type='social',
            content_text=fake.text()
        )

        comment = Comment.objects.create(
            user=self.user,
            post=post,
            text=fake.sentence()
        )

        serializer = CommentSerializer(comment)
        data = serializer.data

        self.assertEqual(data['id'], comment.id)
        self.assertEqual(data['text'], comment.text)
        self.assertEqual(data['likes_count'], 0)
        self.assertIn('user', data)
        self.assertIn('likes', data)
        self.assertIn('is_liked_by_user', data)

    def test_report_create_serializer_post_report(self):
        """Teste criação de report de post."""
        post = Post.objects.create(
            user=self.user,
            content_type='social',
            content_text=fake.text()
        )

        valid_data = {
            'report_type': 'post',
            'post': post.id,
            'reason': 'spam',
            'other_reason': 'Conteúdo suspeito'
        }

        serializer = ReportCreateSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

    def test_report_create_serializer_comment_report(self):
        """Teste criação de report de comentário."""
        post = Post.objects.create(
            user=self.user,
            content_type='social',
            content_text=fake.text()
        )

        comment = Comment.objects.create(
            user=self.user,
            post=post,
            text=fake.sentence()
        )

        valid_data = {
            'report_type': 'comment',
            'comment': comment.id,
            'reason': 'inappropriate',
            'other_reason': 'Comentário ofensivo'
        }

        serializer = ReportCreateSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

    def test_report_create_serializer_invalid_post_report(self):
        """Teste validação de report de post sem post."""
        invalid_data = {
            'report_type': 'post',
            'reason': 'spam'
            # Faltando campo post
        }

        serializer = ReportCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('post is required', str(serializer.errors))

    def test_report_create_serializer_invalid_comment_report(self):
        """Teste validação de report de comentário sem comentário."""
        invalid_data = {
            'report_type': 'comment',
            'reason': 'harassment'
            # Faltando campo comment
        }

        serializer = ReportCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('comment is required', str(serializer.errors))

    def test_report_create_serializer_mixed_content(self):
        """Teste validação para evitar conteúdo misto em reports."""
        post = Post.objects.create(
            user=self.user,
            content_type='social',
            content_text=fake.text()
        )

        comment = Comment.objects.create(
            user=self.user,
            post=post,
            text=fake.sentence()
        )

        # Report de post com comentário
        invalid_data = {
            'report_type': 'post',
            'post': post.id,
            'comment': comment.id,
            'reason': 'spam'
        }

        serializer = ReportCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('Only post should be set', str(serializer.errors))

    def test_serializer_context_user(self):
        """Teste que serializers usam contexto do usuário corretamente."""
        post = Post.objects.create(
            user=self.user,
            content_type='social',
            content_text=fake.text()
        )

        # Mock request para testar is_liked_by_user
        from unittest.mock import Mock
        mock_request = Mock()
        mock_request.user = self.user
        # mock_request.user.is_authenticated = True

        context = {'request': mock_request}
        serializer = PostSerializer(post, context=context)
        data = serializer.data

        self.assertIn('is_liked_by_user', data)
        self.assertFalse(data['is_liked_by_user'])  # Usuário não curtiu o próprio post
