from django.test import TestCase
from django.urls import reverse, resolve

from status.views import StatusAPIView, StatusDetailAPIView


class StatusUrlTest(TestCase):

    def test_status_list_url_resolves(self):
        """Testa se a URL da lista de status resolve corretamente"""
        url = reverse('status-list')
        self.assertEqual(url, '/api/v1/status/')

        resolved = resolve(url)
        self.assertEqual(resolved.func.view_class, StatusAPIView)

    def test_status_detail_url_resolves(self):
        """Testa se a URL de detalhe do status resolve corretamente"""
        url = reverse('status-detail', kwargs={'pk': 1})
        self.assertEqual(url, '/api/v1/status/1/')

        resolved = resolve(url)
        self.assertEqual(resolved.func.view_class, StatusDetailAPIView)

    def test_status_detail_url_with_different_pks(self):
        """Testa URLs de detalhe com diferentes PKs"""
        test_pks = [1, 5, 10, 999]

        for pk in test_pks:
            url = reverse('status-detail', kwargs={'pk': pk})
            self.assertEqual(url, f'/api/v1/status/{pk}/')

            resolved = resolve(url)
            self.assertEqual(resolved.func.view_class, StatusDetailAPIView)

    def test_status_list_url_name(self):
        """Testa o nome da URL da lista"""
        url = reverse('status-list')
        resolved = resolve(url)
        self.assertEqual(resolved.url_name, 'status-list')

    def test_status_detail_url_name(self):
        """Testa o nome da URL de detalhe"""
        url = reverse('status-detail', kwargs={'pk': 1})
        resolved = resolve(url)
        self.assertEqual(resolved.url_name, 'status-detail')

    def test_invalid_status_detail_url(self):
        """Testa que URLs inválidas para detalhe não resolvem"""
        from django.urls.exceptions import NoReverseMatch

        # Tenta criar URL sem PK
        with self.assertRaises(NoReverseMatch):
            reverse('status-detail')

    def test_status_urls_pattern_matching(self):
        """Testa padrões de correspondência das URLs"""
        # URL raiz deve corresponder à lista
        resolved = resolve('/api/v1/status/')
        self.assertEqual(resolved.func.view_class, StatusAPIView)

        # URLs com números devem corresponder ao detalhe
        test_urls = ['/api/v1/status/1/', '/api/v1/status/123/', '/api/v1/status/9999/']
        for test_url in test_urls:
            resolved = resolve(test_url)
            self.assertEqual(resolved.func.view_class, StatusDetailAPIView)

    def test_trailing_slash_handling(self):
        """Testa o tratamento de barra final nas URLs"""
        # Com barra final
        url_with_slash = reverse('status-list')
        self.assertTrue(url_with_slash.endswith('/'))

        detail_url_with_slash = reverse('status-detail', kwargs={'pk': 1})
        self.assertTrue(detail_url_with_slash.endswith('/'))

    def test_url_kwargs_extraction(self):
        """Testa a extração de kwargs das URLs"""
        url = reverse('status-detail', kwargs={'pk': 42})
        resolved = resolve(url)

        self.assertEqual(resolved.kwargs['pk'], 42)  # URLs retornam strings

    def test_all_url_patterns_covered(self):
        """Testa que todos os padrões de URL estão cobertos"""
        from status.urls import urlpatterns

        # Deve haver exatamente 2 padrões de URL
        self.assertEqual(len(urlpatterns), 2)

        # Verifica se os nomes estão corretos
        url_names = [pattern.name for pattern in urlpatterns]
        self.assertIn('status-list', url_names)
        self.assertIn('status-detail', url_names)
