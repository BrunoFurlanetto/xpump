import tempfile
from django.utils import timezone
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from faker import Faker

from social_feed.models import Post, Comment, Report
from nutrition.models import Meal, MealConfig
from .base import SocialFeedAPITestCase

fake = Faker('pt_BR')


class PostViewSetTest(SocialFeedAPITestCase):
    """Testes para PostViewSet."""

    def test_list_posts_authenticated(self):
        """Teste listagem de posts com usuário autenticado."""
        self.client.force_authenticate(user=self.user1)

        # Criar alguns posts
        Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text(),
            visibility='global'
        )
        Post.objects.create(
            user=self.user2,
            content_type='social',
            content_text=fake.text(),
            visibility='global'
        )

        url = reverse('social_feed:posts-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_list_posts_unauthenticated(self):
        """Teste que usuário não autenticado não pode listar posts."""
        url = reverse('social_feed:posts-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_social_post(self):
        """Teste criação de post social."""
        self.client.force_authenticate(user=self.user1)

        data = {
            'content_type': 'social',
            'content_text': fake.text(max_nb_chars=200),
            'visibility': 'global',
            'allow_comments': True
        }

        url = reverse('social_feed:posts-list')
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 1)
        post = Post.objects.first()
        self.assertEqual(post.user, self.user1)
        self.assertEqual(post.content_type, 'social')

    @override_settings(MEDIA_ROOT=tempfile.gettempdir())
    def test_create_post_with_files(self):
        """Teste criação de post com arquivos."""
        self.client.force_authenticate(user=self.user1)

        image = self.create_test_image()

        data = {
            'content_type': 'social',
            'content_text': fake.text(),
            'files': [image],
            'visibility': 'global'
        }

        url = reverse('social_feed:posts-list')
        response = self.client.post(url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post = Post.objects.first()
        self.assertEqual(post.content_files.count(), 1)

    def test_retrieve_post(self):
        """Teste recuperação de um post específico."""
        self.client.force_authenticate(user=self.user1)

        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        url = reverse('social_feed:posts-detail', kwargs={'pk': post.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], post.id)
        self.assertEqual(response.data['content_type'], 'social')

    def test_retrieve_meal_post_returns_meal_type_display_name(self):
        """Post de refeição deve retornar meal_type como nome exibido."""
        self.client.force_authenticate(user=self.user1)

        meal_config = MealConfig.objects.create(
            meal_name='breakfast',
            interval_start='07:00:00',
            interval_end='09:00:00'
        )
        meal = Meal.objects.create(
            user=self.user1,
            meal_type=meal_config,
            meal_time=timezone.now(),
            fasting=True
        )
        post = Post.objects.create(
            user=self.user1,
            content_type='meal',
            meal=meal,
            visibility='global'
        )

        url = reverse('social_feed:posts-detail', kwargs={'pk': post.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content_type'], 'meal')
        self.assertEqual(response.data['meal']['meal_type'], 'Café da manhã')

    def test_update_post(self):
        """Teste atualização de post."""
        self.client.force_authenticate(user=self.user1)

        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text='Texto original'
        )

        data = {
            'content_type': 'social',
            'content_text': 'Texto atualizado',
            'visibility': 'global'
        }

        url = reverse('social_feed:posts-detail', kwargs={'pk': post.pk})
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        post.refresh_from_db()
        self.assertEqual(post.content_text, 'Texto atualizado')

    def test_delete_post(self):
        """Teste exclusão de post."""
        self.client.force_authenticate(user=self.user1)

        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        url = reverse('social_feed:posts-detail', kwargs={'pk': post.pk})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=post.id).exists())

    def test_toggle_like_post(self):
        """Teste toggle like em post."""
        self.client.force_authenticate(user=self.user1)

        post = Post.objects.create(
            user=self.user2,
            content_type='social',
            content_text=fake.text()
        )

        url = reverse('social_feed:posts-toggle-like', kwargs={'pk': post.pk})

        # Dar like
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['liked'])

        # Remover like
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['liked'])

    def test_add_comment_to_post(self):
        """Teste adicionar comentário a um post."""
        self.client.force_authenticate(user=self.user1)

        post = Post.objects.create(
            user=self.user2,
            content_type='social',
            content_text=fake.text()
        )

        url = reverse('social_feed:posts-add-comment', kwargs={'pk': post.pk})
        data = {'text': fake.sentence()}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)
        comment = Comment.objects.first()
        self.assertEqual(comment.user, self.user1)
        self.assertEqual(comment.post, post)

    def test_get_post_comments(self):
        """Teste obter comentários de um post."""
        self.client.force_authenticate(user=self.user1)

        post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

        # Criar alguns comentários
        for i in range(5):
            Comment.objects.create(
                user=self.user1 if i % 2 == 0 else self.user2,
                post=post,
                text=fake.sentence()
            )

        url = reverse('social_feed:posts-comments', kwargs={'pk': post.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 5)

    def test_filter_posts_by_visibility(self):
        """Teste filtrar posts por visibilidade."""
        self.client.force_authenticate(user=self.user1)

        # Criar posts com diferentes visibilidades
        Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text(),
            visibility='global'
        )
        Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text(),
            visibility='private'
        )

        # Filtrar por posts globais
        url = reverse('social_feed:posts-list') + '?visibility=global'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar que só retorna posts globais
        for post in response.data['results']:
            self.assertEqual(post['visibility'], 'global')

    def test_filter_posts_by_content_type(self):
        """Teste filtrar posts por tipo de conteúdo."""
        self.client.force_authenticate(user=self.user1)

        # Criar posts de diferentes tipos
        Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text(),
            visibility='global'
        )
        Post.objects.create(
            user=self.user1,
            content_type='achievement',
            content_text=fake.text(),
            visibility='global'
        )

        # Filtrar por posts sociais
        url = reverse('social_feed:posts-list') + '?content_type=social'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar que só retorna posts sociais
        for post in response.data['results']:
            self.assertEqual(post['content_type'], 'social')


class ReportViewTest(SocialFeedAPITestCase):
    """Testes para views de reports."""

    def setUp(self):
        """Setup para testes de reports."""
        super().setUp()
        self.user1.first_name = 'Admin'
        self.user1.last_name = 'User'
        self.user1.save(update_fields=['first_name', 'last_name'])
        self.user2.first_name = 'Common'
        self.user2.last_name = 'User'
        self.user2.save(update_fields=['first_name', 'last_name'])

        self.admin = self.user1
        self.admin.is_staff = True
        self.admin.save(update_fields=['is_staff'])

        self.post_1 = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text='Post 1',
            visibility='global'
        )
        self.post_2 = Post.objects.create(
            user=self.user2,
            content_type='social',
            content_text='Post 2',
            visibility='global'
        )

        self.report_user1_pending = Report.objects.create(
            report_type='post',
            post=self.post_2,
            reported_by=self.user1,
            reason='spam',
            status='pending'
        )
        self.report_user2_resolved = Report.objects.create(
            report_type='post',
            post=self.post_1,
            reported_by=self.user2,
            reason='harassment',
            status='resolved'
        )

    def test_non_admin_only_sees_own_reports(self):
        """Usuário comum deve listar apenas os próprios reports."""
        self.admin.is_staff = False
        self.admin.save(update_fields=['is_staff'])
        self.client.force_authenticate(user=self.user1)

        url = reverse('social_feed:report-list-create')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.report_user1_pending.id)

    def test_admin_sees_all_reports(self):
        """Admin deve listar todos os reports."""
        self.client.force_authenticate(user=self.admin)

        url = reverse('social_feed:report-list-create')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 2)

    def test_admin_can_filter_reports_by_status(self):
        """Admin deve conseguir filtrar reports por status."""
        self.client.force_authenticate(user=self.admin)

        url = reverse('social_feed:report-list-create') + '?status=resolved'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'resolved')
        self.assertEqual(response.data['results'][0]['id'], self.report_user2_resolved.id)

    def test_report_list_returns_reported_post_details(self):
        """Retorno de report deve incluir detalhes do post reportado."""
        self.client.force_authenticate(user=self.admin)

        url = reverse('social_feed:report-list-create') + '?status=pending'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)

        report_payload = response.data['results'][0]
        self.assertIn('reported_post', report_payload)
        self.assertIsNotNone(report_payload['reported_post'])
        self.assertEqual(report_payload['reported_post']['id'], self.post_2.id)
        self.assertEqual(report_payload['reported_post']['content_text'], self.post_2.content_text)
        self.assertEqual(report_payload['reported_by']['id'], self.user1.id)
        self.assertEqual(report_payload['reported_by']['full_name'], 'Admin User')
        self.assertEqual(report_payload['reported_post']['user']['id'], self.user2.id)
        self.assertEqual(report_payload['reported_post']['user']['full_name'], 'Common User')

    def test_status_filter_returns_paginated_data(self):
        """Filtro por status deve respeitar paginação."""
        self.client.force_authenticate(user=self.admin)

        Report.objects.create(
            report_type='post',
            post=self.post_2,
            reported_by=self.user2,
            reason='fake',
            status='pending'
        )

        url = reverse('social_feed:report-list-create') + '?status=pending&page=1&page_size=1'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 1)
        self.assertIsNotNone(response.data['next'])


class CommentViewTest(SocialFeedAPITestCase):
    """Testes para views de comentários."""

    def setUp(self):
        """Setup para testes de comentários."""
        super().setUp()
        self.post = Post.objects.create(
            user=self.user1,
            content_type='social',
            content_text=fake.text()
        )

    def test_list_comments(self):
        """Teste listagem de comentários."""
        self.client.force_authenticate(user=self.user1)

        # Criar alguns comentários
        for i in range(3):
            Comment.objects.create(
                user=self.user1,
                post=self.post,
                text=fake.sentence()
            )

        url = reverse('social_feed:comment-list-create')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 3)

    def test_create_comment(self):
        """Teste criação de comentário."""
        self.client.force_authenticate(user=self.user1)

        data = {
            'post': self.post.id,
            'text': fake.sentence()
        }

        url = reverse('social_feed:comment-list-create')
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)

    def test_retrieve_comment(self):
        """Teste recuperação de comentário específico."""
        self.client.force_authenticate(user=self.user1)

        comment = Comment.objects.create(
            user=self.user1,
            post=self.post,
            text=fake.sentence()
        )

        url = reverse('social_feed:comment-detail', kwargs={'pk': comment.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], comment.id)

    def test_update_comment(self):
        """Teste atualização de comentário."""
        self.client.force_authenticate(user=self.user1)

        comment = Comment.objects.create(
            user=self.user1,
            post=self.post,
            text='Texto original'
        )

        data = {
            'post': self.post.id,
            'text': 'Texto atualizado'
        }

        url = reverse('social_feed:comment-detail', kwargs={'pk': comment.pk})
        response = self.client.put(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comment.refresh_from_db()
        self.assertEqual(comment.text, 'Texto atualizado')

    def test_delete_comment(self):
        """Teste exclusão de comentário."""
        self.client.force_authenticate(user=self.user1)

        comment = Comment.objects.create(
            user=self.user1,
            post=self.post,
            text=fake.sentence()
        )

        url = reverse('social_feed:comment-detail', kwargs={'pk': comment.pk})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(id=comment.id).exists())

    def test_toggle_comment_like(self):
        """Teste toggle like em comentário."""
        self.client.force_authenticate(user=self.user1)

        comment = Comment.objects.create(
            user=self.user2,
            post=self.post,
            text=fake.sentence()
        )

        url = reverse('social_feed:comment-toggle-like', kwargs={'pk': comment.pk})

        # Dar like
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['liked'])

        # Remover like
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['liked'])

    def test_update_comment_permission(self):
        """Teste que usuário só pode atualizar próprios comentários."""
        self.client.force_authenticate(user=self.user1)

        # Criar comentário do user2
        comment = Comment.objects.create(
            user=self.user2,
            post=self.post,
            text=fake.sentence()
        )

        data = {
            'post': self.post.id,
            'text': 'Tentativa de atualização'
        }

        url = reverse('social_feed:comment-detail', kwargs={'pk': comment.pk})
        response = self.client.put(url, data)

        # Deve retornar erro de permissão
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_comment_permission(self):
        """Teste que usuário só pode deletar próprios comentários."""
        self.client.force_authenticate(user=self.user1)

        # Criar comentário do user2
        comment = Comment.objects.create(
            user=self.user2,
            post=self.post,
            text=fake.sentence()
        )

        url = reverse('social_feed:comment-detail', kwargs={'pk': comment.pk})
        response = self.client.delete(url)

        # Deve retornar erro de permissão
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
