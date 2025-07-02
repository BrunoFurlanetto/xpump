# profiles/views.py
from drf_spectacular.utils import extend_schema
from rest_framework import status, generics
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Profile
from .serializers import ProfilesSerialializer


@extend_schema(tags=['Profiles'])
class ProfilesAPIView(generics.ListCreateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfilesSerialializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']


@extend_schema(tags=['Profiles'])
class ProfileAPIView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfilesSerialializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put']

    def destroy(self, request, *args, **kwargs):
        return Response({"detail": "Method 'DELETE' not allowed for profiles."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
