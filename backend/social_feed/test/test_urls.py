from django.test import TestCase
from django.urls import reverse, resolve, Resolver404
from django.contrib.auth.models import User

from social_feed.views import (
    PostViewSet, CommentListCreateView, CommentDetailView,
    CommentToggleLikeView, ReportListCreateView, ReportDetailView,
    UserPostsView
)


class URLTest(TestCase):
    """Testes para URLs do social feed."""

    def setUp(self):
        """Setup básico para testes de URLs."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )

    def test_posts_list_url(self):
        """Teste URL de listagem de posts."""
        url = reverse('social_feed:posts-list')
        self.assertEqual(url, '/api/v1/social-feed/posts/')

        # Verificar que resolve para a view correta
        resolver = resolve(url)
        self.assertEqual(resolver.func.cls, PostViewSet)

    def test_posts_detail_url(self):
        """Teste URL de detalhes do post."""
        url = reverse('social_feed:posts-detail', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/social-feed/posts/1/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.cls, PostViewSet)

    def test_posts_toggle_like_url(self):
        """Teste URL para toggle like em post."""
        url = reverse('social_feed:posts-toggle-like', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/social-feed/posts/1/toggle_like/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.cls, PostViewSet)

    def test_posts_add_comment_url(self):
        """Teste URL para adicionar comentário ao post."""
        url = reverse('social_feed:posts-add-comment', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/social-feed/posts/1/add_comment/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.cls, PostViewSet)

    def test_posts_comments_url(self):
        """Teste URL para listar comentários do post."""
        url = reverse('social_feed:posts-comments', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/social-feed/posts/1/comments/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.cls, PostViewSet)

    def test_comments_list_create_url(self):
        """Teste URL de listagem e criação de comentários."""
        url = reverse('social_feed:comment-list-create')
        self.assertEqual(url, '/api/v1/social-feed/comments/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, CommentListCreateView)

    def test_comments_detail_url(self):
        """Teste URL de detalhes do comentário."""
        url = reverse('social_feed:comment-detail', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/social-feed/comments/1/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, CommentDetailView)

    def test_comment_toggle_like_url(self):
        """Teste URL para toggle like em comentário."""
        url = reverse('social_feed:comment-toggle-like', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/social-feed/comments/1/toggle-like/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, CommentToggleLikeView)

    def test_reports_list_create_url(self):
        """Teste URL de listagem e criação de reports."""
        url = reverse('social_feed:report-list-create')
        self.assertEqual(url, '/api/v1/social-feed/reports/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, ReportListCreateView)

    def test_reports_detail_url(self):
        """Teste URL de detalhes do report."""
        url = reverse('social_feed:report-detail', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/social-feed/reports/1/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, ReportDetailView)

    def test_user_posts_url(self):
        """Teste URL para posts de usuário específico."""
        url = reverse('social_feed:user-posts', kwargs={'user_id': 1})
        self.assertEqual(url, '/api/v1/social-feed/users/1/posts/')

        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, UserPostsView)

    def test_url_namespacing(self):
        """Teste que todas as URLs estão no namespace correto."""
        urls_to_test = [
            'posts-list',
            'posts-detail',
            'comment-list-create',
            'comment-detail',
            'comment-toggle-like',
            'report-list-create',
            'report-detail',
            'user-posts'
        ]

        for url_name in urls_to_test:
            try:
                if url_name in ['posts-detail', 'comment-detail', 'report-detail', 'comment-toggle-like']:
                    url = reverse(f'social_feed:{url_name}', kwargs={'pk': 1})
                elif url_name == 'user-posts':
                    url = reverse(f'social_feed:{url_name}', kwargs={'user_id': 1})
                else:
                    url = reverse(f'social_feed:{url_name}')

                self.assertIsNotNone(url)
                self.assertTrue(url.startswith('/api/v1/social-feed/'))
            except Exception as e:
                self.fail(f"Failed to reverse URL {url_name}: {e}")

    def test_url_parameters(self):
        """Teste que URLs com parâmetros funcionam corretamente."""
        # Teste com diferentes IDs
        test_ids = [1, 123, 999]

        for test_id in test_ids:
            # Teste URLs com pk
            urls_with_pk = [
                'posts-detail',
                'comment-detail',
                'comment-toggle-like',
                'report-detail'
            ]

            for url_name in urls_with_pk:
                url = reverse(f'social_feed:{url_name}', kwargs={'pk': test_id})
                resolver = resolve(url)
                self.assertEqual(int(resolver.kwargs['pk']), test_id)

            # Teste URL com user_id
            url = reverse('social_feed:user-posts', kwargs={'user_id': test_id})
            resolver = resolve(url)
            self.assertEqual(int(resolver.kwargs['user_id']), test_id)

    # python
    def test_invalid_urls(self):
        """Teste que URLs inválidas não resolvem ou possuem parâmetros inválidos."""
        invalid_urls = [
            '/api/v1/social-feed/invalid/',
            '/api/v1/social-feed/posts/invalid/',
            '/api/v1/social-feed/comments/abc/',
        ]

        for invalid_url in invalid_urls:
            try:
                resolver = resolve(invalid_url)
            except Resolver404:
                # comportamento esperado: não resolve
                continue
            else:
                # Se resolver, garantir que parâmetros esperados como numéricos não são conversíveis para int
                kwargs = resolver.kwargs
                numeric_keys = [k for k in ('pk', 'user_id') if k in kwargs]

                if numeric_keys:
                    for key in numeric_keys:
                        with self.assertRaises((ValueError, TypeError)):
                            int(kwargs[key])
                else:
                    # Se resolveu sem parâmetros numéricos, ainda é inesperado
                    self.fail(f"URL inválida resolveu inesperadamente: {invalid_url}")

