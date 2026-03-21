from django.shortcuts import render
from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from gamification.models import GamificationSettings, Season, GamificationBonus, GamificationPenalty
from gamification.serializer import (
    GamificationSettingsSerializer,
    SeasonSerializer,
    GamificationAdjustmentSerializer,
    GamificationAdjustmentResponseSerializer,
)


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


@extend_schema(tags=['Gamification'], request=GamificationAdjustmentSerializer, responses=GamificationAdjustmentResponseSerializer)
class GamificationAdjustmentsAPIView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GamificationAdjustmentSerializer

    def get_queryset(self):
        return GamificationBonus.objects.none()

    def list(self, request, *args, **kwargs):
        adjustment_type = request.query_params.get('adjustment_type')
        user_id = request.query_params.get('user_id')
        target_type = request.query_params.get('target_type')
        target_id = request.query_params.get('target_id')

        bonuses_qs = GamificationBonus.objects.all().select_related('content_type')
        penalties_qs = GamificationPenalty.objects.all().select_related('content_type')

        if user_id:
            bonuses_qs = bonuses_qs.filter(created_by_id=user_id)
            penalties_qs = penalties_qs.filter(created_by_id=user_id)

        if target_id:
            bonuses_qs = bonuses_qs.filter(object_id=target_id)
            penalties_qs = penalties_qs.filter(object_id=target_id)

        if target_type == 'meal':
            bonuses_qs = bonuses_qs.filter(content_type__model='meal')
            penalties_qs = penalties_qs.filter(content_type__model='meal')
        elif target_type == 'workout_checkin':
            bonuses_qs = bonuses_qs.filter(content_type__model='workoutcheckin')
            penalties_qs = penalties_qs.filter(content_type__model='workoutcheckin')

        items = []
        if adjustment_type in (None, '', 'bonus'):
            items.extend([
                GamificationAdjustmentSerializer.to_adjustment_payload(obj, 'bonus')
                for obj in bonuses_qs
            ])
        if adjustment_type in (None, '', 'penalty'):
            items.extend([
                GamificationAdjustmentSerializer.to_adjustment_payload(obj, 'penalty')
                for obj in penalties_qs
            ])

        items.sort(key=lambda item: item['created_at'], reverse=True)
        serializer = GamificationAdjustmentResponseSerializer(items, many=True)

        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        adjustment_type = serializer.validated_data['adjustment_type']
        payload = GamificationAdjustmentSerializer.to_adjustment_payload(instance, adjustment_type)

        return Response(GamificationAdjustmentResponseSerializer(payload).data, status=201)
