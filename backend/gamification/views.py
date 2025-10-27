from django.shortcuts import render
from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from gamification.models import GamificationSettings, Season
from gamification.serializer import GamificationSettingsSerializer, SeasonSerializer


@extend_schema(tags=['Gamification settings'])
class ListGamificationSettingsAPIView(ListCreateAPIView):
    """
    API view to create and list gamification settings.
    """
    queryset = GamificationSettings.objects.all()
    serializer_class = GamificationSettingsSerializer
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        if queryset.count() > 0:
            return Response({"detail": "Only one GamificationSettings instance is allowed."}, status=400)

        return super().post(request, *args, **kwargs)


@extend_schema(tags=['Gamification settings'])
class DetailGamificationSettingsAPIView(RetrieveUpdateAPIView):
    """
    API view to retrieve and update gamification settings.
    """
    queryset = GamificationSettings.objects.all()
    serializer_class = GamificationSettingsSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=['Season'])
class SeasonList(ListCreateAPIView):
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=['Season'])
class SeasonDetail(RetrieveUpdateDestroyAPIView):
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=['Season'])
class SeasonByClient(ListAPIView):
    """
    API view to list seasons by client ID.
    """
    serializer_class = SeasonSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        client_id = self.kwargs['client_id']
        return Season.objects.filter(client_id=client_id)
