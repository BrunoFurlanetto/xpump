from django.shortcuts import render
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema_view, extend_schema
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from rest_framework import status, permissions
from .models import WorkoutCheckin, WorkoutPlan
from .serializer import WorkoutCheckinSerializer, WorkoutPlanSerializer


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


@extend_schema(tags=['Workouts'])
class WorkoutCheckinsAPIView(ListCreateAPIView):
    """
    API view for listing all workout check-ins and creating new ones.
    - GET: Returns list of all workout check-ins
    - POST: Creates new workout check-in for authenticated user
    """
    queryset = WorkoutCheckin.objects.all()
    serializer_class = WorkoutCheckinSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Create workout check-in with the authenticated user as owner.
        Automatically assigns the current user to the check-in.
        """
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Handle workout check-in creation with comprehensive error handling.
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
                # Handle model validation errors (overlapping workouts, etc.)
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(tags=['Workouts'])
class WorkoutCheckinAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual workout check-in operations.
    Allows users to view, update (comments only), and delete their own check-ins.
    """
    queryset = WorkoutCheckin.objects.all()
    serializer_class = WorkoutCheckinSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def update(self, request, *args, **kwargs):
        """
        Update workout check-in with validation error handling.
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


@extend_schema(tags=['Workouts'])
class WorkoutCheckinsByUserAPIView(ListAPIView):
    """
    API view for retrieving workout check-ins for a specific user.
    Returns check-ins ordered by workout date (most recent first).
    """
    serializer_class = WorkoutCheckinSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'user_id'

    def get_queryset(self):
        """
        Filter workout check-ins by user ID from URL parameters.
        Returns check-ins ordered by most recent first.
        """
        user_id = self.kwargs.get('user_id')

        return WorkoutCheckin.objects.filter(user=user_id).order_by('-workout_date')


@extend_schema(tags=['Workouts'])
class WorkoutPlansAPIView(ListAPIView):
    """
    API view for listing all available workout plans.
    Read-only endpoint that returns all workout plans for authenticated users.
    """
    queryset = WorkoutPlan.objects.all()
    serializer_class = WorkoutPlanSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Workouts'])
class WorkoutPlanAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual workout plan operations.
    Only superusers can modify or delete workout plans to maintain data integrity.
    """
    queryset = WorkoutPlan.objects.all()
    serializer_class = WorkoutPlanSerializer
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
        Delete workout plan with superuser permission check.
        Restricts deletions to superusers only to prevent accidental data loss.
        """
        if request.user.is_superuser:
            return super().destroy(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to delete this resource."},
                status=status.HTTP_403_FORBIDDEN
            )
