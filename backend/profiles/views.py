from drf_spectacular.utils import extend_schema
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView

from .models import Profile
from .serializers import ProfilesSerialializer


@extend_schema(tags=['Profiles'])
class ProfilesAPIView(generics.ListCreateAPIView):
    """
    API view for listing all user profiles.
    Read-only endpoint that returns all profiles with workout streak information.
    Requires authentication to access profile data.
    """
    queryset = Profile.objects.all()
    serializer_class = ProfilesSerialializer
    permission_classes = [IsAuthenticated]  # Require authentication to view profiles
    http_method_names = ['get']  # Only allow GET requests (read-only)


@extend_schema(tags=['Profiles'])
class ProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    API view for individual profile operations (retrieve and update).
    Allows authenticated users to view and update specific profile information.
    Supports file uploads for profile photos.
    """
    queryset = Profile.objects.all()
    serializer_class = ProfilesSerialializer
    permission_classes = [IsAuthenticated]  # Require authentication for profile access
    http_method_names = ['get', 'put']  # Allow GET (retrieve) and PUT (update) operations


@extend_schema(tags=['Profiles'])
class ProfileMeAPIView(APIView):
    """
        API view for retrieving profile the authenticated user.
        Returns Profile associated with the user.
        """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            profile = Profile.objects.get(user=self.request.user)
        except Profile.DoesNotExist:
            Profile.objects.create(user=self.request.user)

        serializer = ProfilesSerialializer(request.user.profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
