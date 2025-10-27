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
from clients.models import Client
from profiles.models import Profile


@extend_schema(tags=['User'])
class UsersListAPIView(generics.ListCreateAPIView):
    """
    API view for listing all users and creating new user accounts.
    - GET: Returns list of all users (public access)
    - POST: Creates new user with associated profile (public access for registration)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Allow anonymous access for user registration

    def create(self, request, *args, **kwargs):
        """
        Create a new user account with automatic profile creation.
        Returns user data with profile ID on successful registration.
        """
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Create user instance
            user = serializer.save()
            # Automatically create associated profile for the new user

            # Return user data with profile information
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
            # Return validation errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['User'])
class UserAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view for individual user operations (retrieve, update, delete).
    Requires authentication - users can only access their own data.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Require authentication for all operations

    def perform_destroy(self, instance):
        """
        Delete user account and associated profile.
        Ensures cascade deletion of related profile data.
        """
        # Delete associated profile if it exists
        if hasattr(instance, 'profile'):
            instance.profile.delete()

        # Delete the user instance
        instance.delete()


# -----------------------------------------------Views of JWT token ----------------------------------------------------

@extend_schema(tags=["JWT Auth"])
class TokenObtainPairView(SimpleJWTTokenObtainPairView):
    """
    JWT token obtain view for user authentication.
    Returns access and refresh tokens for valid credentials.
    """
    pass


@extend_schema(tags=["JWT Auth"])
class TokenRefreshView(SimpleJWTTokenRefreshView):
    """
    JWT token refresh view for obtaining new access tokens.
    Uses refresh token to generate new access token.
    """
    pass


@extend_schema(tags=["JWT Auth"])
class TokenVerifyView(SimpleJWTTokenVerifyView):
    """
    JWT token verification view to validate token authenticity.
    Checks if provided token is valid and not expired.
    """
    pass
