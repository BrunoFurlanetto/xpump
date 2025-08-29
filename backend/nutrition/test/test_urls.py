from django.test import SimpleTestCase
from django.urls import reverse, resolve
from nutrition import views

class TestNutritionUrls(SimpleTestCase):
    def test_meals_list_url_resolves(self):
        url = reverse('meals-list')
        self.assertEqual(resolve(url).func.view_class, views.MealsAPIView)

    def test_meal_detail_url_resolves(self):
        url = reverse('meal-detail', args=[1])
        self.assertEqual(resolve(url).func.view_class, views.MealAPIView)

    def test_meal_choices_url_resolves(self):
        url = reverse('meal-choices')
        self.assertEqual(resolve(url).func.view_class, views.MealChoicesAPIView)

    def test_meal_types_list_url_resolves(self):
        url = reverse('meal-configs-list')
        self.assertEqual(resolve(url).func.view_class, views.MealTypesAPIView)

    def test_meal_type_detail_url_resolves(self):
        url = reverse('meal-config-detail', args=[1])
        self.assertEqual(resolve(url).func.view_class, views.MealTypeAPIView)

    def test_meals_by_user_url_resolves(self):
        url = reverse('meals-by-user', args=[1])
        self.assertEqual(resolve(url).func.view_class, views.MealsByUserAPIView)

    def test_nutrition_plans_list_url_resolves(self):
        url = reverse('nutrition-plans-list')
        self.assertEqual(resolve(url).func.view_class, views.NutritionPlansAPIView)

    def test_nutrition_plan_detail_url_resolves(self):
        url = reverse('nutrition-plan-detail', args=[1])
        self.assertEqual(resolve(url).func.view_class, views.NutritionPlanAPIView)

