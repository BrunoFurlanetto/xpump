from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema_view, extend_schema
from rest_framework import status, permissions
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from nutrition.models import Meal, NutritionPlan, MealConfig, meal_choices
from nutrition.serializer import MealSerializer, NutritionPlanSerializer, MealConfigSerializer, MealChoicesSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom perms: Only the owner of the object can update or remove the post
    Another users only can read
    """

    def has_object_permission(self, request, view, obj):
        # Always allow safe requests (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # To destructive or read methods, verify the object
        # Have a field `user` equal to request.user
        return obj.user == request.user


@extend_schema(tags=['Nutrition'])
class MealChoicesAPIView(ListAPIView):
    serializer_class = MealChoicesSerializer

    def get_queryset(self):

        return None

    def list(self, request, *args, **kwargs):
        choices_data = [
            {'value': choice[0], 'label': choice[1]}
            for choice in meal_choices
        ]
        serializer = self.get_serializer(choices_data, many=True)

        return Response(serializer.data)


@extend_schema(tags=['Nutrition'])
class MealTypesAPIView(ListCreateAPIView):
    """
    API view for listing all meal configurations and creating new ones.
    - GET: Returns list of all meal configurations
    - POST: Creates new meal configuration (superuser only)
    """
    queryset = MealConfig.objects.all()
    serializer_class = MealConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            # Only superusers can create new meal configurations
            return [IsAdminUser()]

        return super().get_permissions()

    def perform_create(self, serializer):
        """
        Create meal configuration.
        """
        serializer.save()


@extend_schema(tags=['Nutrition'])
class MealTypeAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual meal configuration operations.
    Only superusers can modify or delete meal configurations to maintain data integrity.
    """
    queryset = MealConfig.objects.all()
    serializer_class = MealConfigSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        """
        Update meal configuration with superuser permission check.
        Restricts modifications to superusers only.
        """
        if request.user.is_superuser:
            return super().update(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to update this resource."},
                status=status.HTTP_403_FORBIDDEN
            )

    def destroy(self, request, *args, **kwargs):
        """
        Delete meal configuration with superuser permission check.
        Restricts deletions to superusers only to prevent accidental data loss.
        """
        if request.user.is_superuser:
            return super().destroy(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to delete this resource."},
                status=status.HTTP_403_FORBIDDEN
            )


@extend_schema(tags=['Nutrition'])
class MealsAPIView(ListCreateAPIView):
    """
    API view for listing all nutrition entries and creating new ones.
    - GET: Returns list of all nutrition entries
    - POST: Creates new nutrition entry for authenticated user
    """
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Create nutrition entry with the authenticated user as owner.
        Automatically assigns the current user to the entry.
        """
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Handle meal check-in creation with comprehensive error handling.
        Manages validation errors and provides detailed error responses.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)

                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED,
                    headers=headers
                )
            except ValidationError as e:
                # Handle model validation errors (overlapping meal, etc.)
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(tags=['Nutrition'])
class MealAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual workout check-in operations.
    Allows users to view, update (comments only), and delete their own check-ins.
    """
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def update(self, request, *args, **kwargs):
        """
        Update meal check-in with validation error handling.
        Only allows updating comments field to prevent data manipulation.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                self.perform_update(serializer)

                return Response(serializer.data)
            except ValidationError as e:
                # Handle model validation errors
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(tags=['Nutrition'])
class MealsByUserAPIView(ListAPIView):
    """
    API view for retrieving meal check-ins for a specific user.
    Returns meals ordered by meal date and time (most recent first).
    """
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'user_id'

    def get_queryset(self):
        """
        Filter workout check-ins by user ID from URL parameters.
        Returns check-ins ordered by most recent first.
        """
        user_id = self.kwargs.get('user_id')

        return Meal.objects.filter(user=user_id).order_by('-meal_time')


@extend_schema(tags=['Nutrition'])
class NutritionPlansAPIView(ListCreateAPIView):
    """
    API view for listing all available nutrition plans.
    Read-only endpoint that returns all nutrition plans for authenticated users.
    """
    queryset = NutritionPlan.objects.all()
    serializer_class = NutritionPlanSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Nutrition'])
class NutritionPlanAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual nutrition plan operations.
    Only superusers can modify or delete nutrition plans to maintain data integrity.
    """
    queryset = NutritionPlan.objects.all()
    serializer_class = NutritionPlanSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        """
        Update workout plan with superuser permission check.
        Restricts modifications to superusers only.
        """
        if request.user.is_superuser:
            return super().update(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to update this resource."},
                status=status.HTTP_403_FORBIDDEN
            )

    def destroy(self, request, *args, **kwargs):
        """
        Delete nutrition plan with superuser permission check.
        Restricts deletions to superusers only to prevent accidental data loss.
        """
        if request.user.is_superuser:
            return super().destroy(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to delete this resource."},
                status=status.HTTP_403_FORBIDDEN
            )
