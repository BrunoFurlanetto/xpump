import tempfile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from faker import Faker

from social_feed.models import Post, Comment
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
