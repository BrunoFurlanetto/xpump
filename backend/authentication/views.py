from django.contrib.auth.models import User
from django.shortcuts import render
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response

from rest_framework_simplejwt.views import (
    TokenObtainPairView as SimpleJWTTokenObtainPairView,
    TokenRefreshView as SimpleJWTTokenRefreshView,
    TokenVerifyView as SimpleJWTTokenVerifyView,
)

from authentication.serializer import UserSerializer
from profiles.models import Profile


@extend_schema(tags=['User'])
class UsersListAPIView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            Profile.objects.create(user=user)

            return Response({
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "is_active": True,
                "date_joined": user.date_joined,
                "profile_id": user.profile.id,
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['User'])
class UserAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if hasattr(instance, 'profile'):
            instance.profile.delete()

        instance.delete()


# -----------------------------------------------Views of JWT token ----------------------------------------------------
@extend_schema(tags=["JWT Auth"])
class TokenObtainPairView(SimpleJWTTokenObtainPairView):
    pass


@extend_schema(tags=["JWT Auth"])
class TokenRefreshView(SimpleJWTTokenRefreshView):
    pass


@extend_schema(tags=["JWT Auth"])
class TokenVerifyView(SimpleJWTTokenVerifyView):
    pass
