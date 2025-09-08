from django.test import TestCase
from django.urls import reverse, resolve
from django.contrib.auth.models import User

from nutrition.views import (
    MealsAPIView, MealAPIView, MealTypesAPIView, MealTypeAPIView,
    MealsByUserAPIView, NutritionPlansAPIView, NutritionPlanAPIView,
    MealChoicesAPIView, MealsByUserByIntervalDateAPIView
)


class NutritionURLsTestCase(TestCase):
    """
    Test cases to verify URL patterns are correctly configured
    and resolve to the expected views.
    """

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_meals_list_url_resolves(self):
        """Test meals list URL resolves to correct view"""
        url = reverse('meals-list')
        self.assertEqual(url, '/api/v1/meals/')

        resolver = resolve('/api/v1/meals/')
        self.assertEqual(resolver.view_name, 'meals-list')
        self.assertEqual(resolver.func.view_class, MealsAPIView)

    def test_meal_detail_url_resolves(self):
        """Test meal detail URL resolves to correct view"""
        url = reverse('meal-detail', args=[1])
        self.assertEqual(url, '/api/v1/meals/1/')

        resolver = resolve('/api/v1/meals/1/')
        self.assertEqual(resolver.view_name, 'meal-detail')
        self.assertEqual(resolver.func.view_class, MealAPIView)
        self.assertEqual(resolver.kwargs['pk'], 1)

    def test_meal_choices_url_resolves(self):
        """Test meal choices URL resolves to correct view"""
        url = reverse('meal-choices')
        self.assertEqual(url, '/api/v1/meals/meal-choices/')

        resolver = resolve('/api/v1/meals/meal-choices/')
        self.assertEqual(resolver.view_name, 'meal-choices')
        self.assertEqual(resolver.func.view_class, MealChoicesAPIView)

    def test_meal_configs_list_url_resolves(self):
        """Test meal configurations list URL resolves to correct view"""
        url = reverse('meal-configs-list')
        self.assertEqual(url, '/api/v1/meals/meal-type/')

        resolver = resolve('/api/v1/meals/meal-type/')
        self.assertEqual(resolver.view_name, 'meal-configs-list')
        self.assertEqual(resolver.func.view_class, MealTypesAPIView)

    def test_meal_config_detail_url_resolves(self):
        """Test meal configuration detail URL resolves to correct view"""
        url = reverse('meal-config-detail', args=[1])
        self.assertEqual(url, '/api/v1/meals/meal-type/1/')

        resolver = resolve('/api/v1/meals/meal-type/1/')
        self.assertEqual(resolver.view_name, 'meal-config-detail')
        self.assertEqual(resolver.func.view_class, MealTypeAPIView)
        self.assertEqual(resolver.kwargs['pk'], 1)

    def test_meals_by_user_url_resolves(self):
        """Test meals by user URL resolves to correct view"""
        url = reverse('meals-by-user', args=[1])
        self.assertEqual(url, '/api/v1/meals/user/1/')

        resolver = resolve('/api/v1/meals/user/1/')
        self.assertEqual(resolver.view_name, 'meals-by-user')
        self.assertEqual(resolver.func.view_class, MealsByUserAPIView)
        self.assertEqual(resolver.kwargs['user_id'], 1)

    def test_nutrition_plans_list_url_resolves(self):
        """Test nutrition plans list URL resolves to correct view"""
        url = reverse('nutrition-plans-list')
        self.assertEqual(url, '/api/v1/meals/plans/')

        resolver = resolve('/api/v1/meals/plans/')
        self.assertEqual(resolver.view_name, 'nutrition-plans-list')
        self.assertEqual(resolver.func.view_class, NutritionPlansAPIView)

    def test_nutrition_plan_detail_url_resolves(self):
        """Test nutrition plan detail URL resolves to correct view"""
        url = reverse('nutrition-plan-detail', args=[1])
        self.assertEqual(url, '/api/v1/meals/plans/1/')

        resolver = resolve('/api/v1/meals/plans/1/')
        self.assertEqual(resolver.view_name, 'nutrition-plan-detail')
        self.assertEqual(resolver.func.view_class, NutritionPlanAPIView)
        self.assertEqual(resolver.kwargs['pk'], 1)

    def test_meals_by_user_by_interval_url_resolves(self):
        """Test meals by user by interval date URL resolves to correct view"""
        url = reverse('meals-by-user-by-interval', args=[1, '2024-01-01', '2024-01-31'])
        self.assertEqual(url, '/api/v1/meals/user/1/2024-01-01/2024-01-31')

        resolver = resolve('/api/v1/meals/user/1/2024-01-01/2024-01-31')
        self.assertEqual(resolver.view_name, 'meals-by-user-by-interval')
        self.assertEqual(resolver.func.view_class, MealsByUserByIntervalDateAPIView)
        self.assertEqual(resolver.kwargs['user_id'], 1)
        self.assertEqual(resolver.kwargs['initial_date'], '2024-01-01')
        self.assertEqual(resolver.kwargs['end_date'], '2024-01-31')

    def test_all_urls_have_names(self):
        """Test that all URLs have proper names assigned"""
        expected_url_names = [
            'meals-list',
            'meal-detail',
            'meal-choices',
            'meal-configs-list',
            'meal-config-detail',
            'meals-by-user',
            'nutrition-plans-list',
            'nutrition-plan-detail',
        ]

        # Test that all expected URLs can be reversed (have names)
        for url_name in expected_url_names:
            with self.subTest(url_name=url_name):
                try:
                    if url_name in ['meal-detail', 'meal-config-detail', 'nutrition-plan-detail']:
                        # URLs that require parameters
                        url = reverse(url_name, args=[1])
                    elif url_name == 'meals-by-user':
                        # URL that requires user_id parameter
                        url = reverse(url_name, args=[1])
                    else:
                        # URLs that don't require parameters
                        url = reverse(url_name)

                    self.assertIsInstance(url, str, f"URL {url_name} should resolve to a string")
                    self.assertTrue(url.startswith('/'), f"URL {url_name} should start with '/'")

                except Exception as e:
                    self.fail(f"URL name '{url_name}' could not be reversed: {e}")

    def test_url_parameters_work_correctly(self):
        """Test that URLs with parameters work correctly"""
        # Test URLs that require integer parameters
        param_urls = [
            ('meal-detail', [1]),
            ('meal-detail', [999]),  # Test with different number
            ('meal-config-detail', [1]),
            ('nutrition-plan-detail', [1]),
            ('meals-by-user', [1]),
            ('meals-by-user', [self.user.pk]),  # Test with actual user ID
        ]

        for url_name, args in param_urls:
            with self.subTest(url_name=url_name, args=args):
                url = reverse(url_name, args=args)
                self.assertIsInstance(url, str)
                self.assertIn(str(args[0]), url, f"URL should contain the parameter {args[0]}")

    def test_url_patterns_are_unique(self):
        """Test that URL patterns don't conflict with each other"""
        # Generate URLs and check for conflicts
        test_urls = {
            reverse('meals-list'): 'meals-list',
            reverse('meal-detail', args=[1]): 'meal-detail',
            reverse('meal-choices'): 'meal-choices',
            reverse('meal-configs-list'): 'meal-configs-list',
            reverse('meal-config-detail', args=[1]): 'meal-config-detail',
            reverse('meals-by-user', args=[1]): 'meals-by-user',
            reverse('nutrition-plans-list'): 'nutrition-plans-list',
            reverse('nutrition-plan-detail', args=[1]): 'nutrition-plan-detail',
        }

        # Check that all URLs are unique
        url_list = list(test_urls.keys())
        unique_urls = set(url_list)
        self.assertEqual(len(url_list), len(unique_urls),
                         f"Duplicate URLs found: {[url for url in test_urls if url_list.count(url) > 1]}")

    def test_url_structure_consistency(self):
        """Test that URL structure follows consistent patterns"""
        # Test basic structure patterns
        meals_list_url = reverse('meals-list')
        self.assertEqual(meals_list_url, '/api/v1/meals/')

        meal_detail_url = reverse('meal-detail', args=[1])
        self.assertTrue(meal_detail_url.startswith('/api/v1/meals/'))
        self.assertTrue(meal_detail_url.endswith('/'))

        # Test nested resource patterns
        plans_list_url = reverse('nutrition-plans-list')
        self.assertTrue(plans_list_url.startswith('/api/v1/meals/'))
        self.assertIn('plans', plans_list_url)

        plan_detail_url = reverse('nutrition-plan-detail', args=[1])
        self.assertTrue(plan_detail_url.startswith('/api/v1/meals/plans/'))

    def test_url_name_consistency_with_views(self):
        """Test that URL names are consistent with their corresponding views"""
        url_view_mapping = {
            'meals-list': MealsAPIView,
            'meal-detail': MealAPIView,
            'meal-choices': MealChoicesAPIView,
            'meal-configs-list': MealTypesAPIView,
            'meal-config-detail': MealTypeAPIView,
            'meals-by-user': MealsByUserAPIView,
            'nutrition-plans-list': NutritionPlansAPIView,
            'nutrition-plan-detail': NutritionPlanAPIView,
        }

        for url_name, expected_view in url_view_mapping.items():
            with self.subTest(url_name=url_name, expected_view=expected_view):
                if url_name in ['meal-detail', 'meal-config-detail', 'nutrition-plan-detail']:
                    resolver = resolve(reverse(url_name, args=[1]))
                elif url_name == 'meals-by-user':
                    resolver = resolve(reverse(url_name, args=[1]))
                else:
                    resolver = resolve(reverse(url_name))

                self.assertEqual(
                    resolver.func.view_class,
                    expected_view,
                    f"URL {url_name} should resolve to {expected_view.__name__}"
                )

    def test_invalid_urls_return_404(self):
        """Test that invalid URLs return 404 errors"""
        invalid_urls = [
            '/nutrition/invalid/',
            '/nutrition/meal-type/invalid/',
            '/nutrition/plans/invalid/',
            '/nutrition/user/invalid/',
            '/nutrition/nonexistent-endpoint/',
        ]

        for invalid_url in invalid_urls:
            with self.subTest(invalid_url=invalid_url):
                with self.assertRaises(Exception):  # Should raise Resolver404 or similar
                    resolve(invalid_url)

    def test_url_trailing_slash_consistency(self):
        """Test that URLs consistently use trailing slashes"""
        urls_to_test = [
            reverse('meals-list'),
            reverse('meal-detail', args=[1]),
            reverse('meal-choices'),
            reverse('meal-configs-list'),
            reverse('meal-config-detail', args=[1]),
            reverse('meals-by-user', args=[1]),
            reverse('nutrition-plans-list'),
            reverse('nutrition-plan-detail', args=[1]),
        ]

        for url in urls_to_test:
            with self.subTest(url=url):
                self.assertTrue(url.endswith('/'), f"URL {url} should end with trailing slash")

    def test_url_namespace_consistency(self):
        """Test that all URLs start with the expected namespace"""
        urls_to_test = [
            reverse('meals-list'),
            reverse('meal-detail', args=[1]),
            reverse('meal-choices'),
            reverse('meal-configs-list'),
            reverse('meal-config-detail', args=[1]),
            reverse('meals-by-user', args=[1]),
            reverse('nutrition-plans-list'),
            reverse('nutrition-plan-detail', args=[1]),
        ]

        for url in urls_to_test:
            with self.subTest(url=url):
                self.assertTrue(
                    url.startswith('/api/v1/meals/'),
                    f"URL {url} should start with '/nutrition/' namespace"
                )
