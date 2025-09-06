from django.urls import path

from nutrition.views import MealsAPIView, MealAPIView, MealTypesAPIView, MealTypeAPIView, MealsByUserAPIView, \
    NutritionPlansAPIView, NutritionPlanAPIView, MealChoicesAPIView, MealsByUserByIntervalDateAPIView

urlpatterns = [
    path('', MealsAPIView.as_view(), name='meals-list'),
    path('<int:pk>/', MealAPIView.as_view(), name='meal-detail'),
    path('meal-choices/', MealChoicesAPIView.as_view(), name='meal-choices'),
    path('meal-type/', MealTypesAPIView.as_view(), name='meal-configs-list'),
    path('meal-type/<int:pk>/', MealTypeAPIView.as_view(), name='meal-config-detail'),
    path('user/<int:user_id>/', MealsByUserAPIView.as_view(), name='meals-by-user'),
    path('user/<int:user_id>/<str:initial_date>/<str:end_date>', MealsByUserByIntervalDateAPIView.as_view(), name='meals-by-user-by-interval'),
    path('plans/', NutritionPlansAPIView.as_view(), name='nutrition-plans-list'),
    path('plans/<int:pk>/', NutritionPlanAPIView.as_view(), name='nutrition-plan-detail'),
]
