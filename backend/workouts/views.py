from django.shortcuts import render
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


class WorkoutCheckinsAPIView(ListCreateAPIView):
    queryset = WorkoutCheckin.objects.all()
    serializer_class = WorkoutCheckinSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutCheckinAPIView(RetrieveUpdateDestroyAPIView):
    queryset = WorkoutCheckin.objects.all()
    serializer_class = WorkoutCheckinSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]


class WorkoutCheckinsByUserAPIView(ListAPIView):
    serializer_class = WorkoutCheckinSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'user_id'

    def get_queryset(self):
        return WorkoutCheckin.objects.filter(user=self.request.user).order_by('-workout_date')


class WorkoutPlansAPIView(ListAPIView):
    queryset = WorkoutPlan.objects.all()
    serializer_class = WorkoutPlanSerializer
    permission_classes = [IsAuthenticated]


class WorkoutPlanAPIView(RetrieveUpdateDestroyAPIView):
    queryset = WorkoutPlan.objects.all()
    serializer_class = WorkoutPlanSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        if request.user.is_superuser:
            return super().update(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to update this resource."},
                status=status.HTTP_403_FORBIDDEN
            )

    def destroy(self, request, *args, **kwargs):
        if request.user.is_superuser:
            return super().destroy(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "You do not have permission to delete this resource."},
                status=status.HTTP_403_FORBIDDEN
            )
