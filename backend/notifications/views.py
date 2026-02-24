import logging

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from django.conf import settings

from .models import Notification, PushSubscription
from .serializer import BroadcastSerializer, NotificationSerializer, PushSubscriptionSerializer
from .services import broadcast_to_employer

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------- #
# Permissões customizadas                                                        #
# ---------------------------------------------------------------------------- #

class IsEmployerOwner(permissions.BasePermission):
    """Permite acesso somente ao proprietário do employer (Client.owners)."""

    def has_permission(self, request, view):
        try:
            employer = request.user.profile.employer
            return employer.owners == request.user
        except Exception:
            return False


# ---------------------------------------------------------------------------- #
# Push Subscription                                                              #
# ---------------------------------------------------------------------------- #

@extend_schema(tags=['Notificações'])
class PushSubscriptionViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    """
    list:   Lista as subscriptions do usuário autenticado.
    create: Registra uma nova subscription de Web Push para o device atual.
    destroy: Remove a subscription (ex: ao fazer logout).
    """
    serializer_class = PushSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PushSubscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Atualiza caso o endpoint já exista para esse usuário (re-subscribe)
        endpoint = serializer.validated_data.get('endpoint')
        PushSubscription.objects.filter(
            user=self.request.user, endpoint=endpoint
        ).delete()
        serializer.save(user=self.request.user)


# ---------------------------------------------------------------------------- #
# Notificações                                                                   #
# ---------------------------------------------------------------------------- #

@extend_schema_view(
    list=extend_schema(
        tags=['Notificações'],
        summary='Lista as notificações do usuário autenticado',
    ),
    mark_read=extend_schema(
        tags=['Notificações'],
        summary='Marca uma notificação como lida',
    ),
    mark_all_read=extend_schema(
        tags=['Notificações'],
        summary='Marca todas as notificações como lidas',
    ),
    unread_count=extend_schema(
        tags=['Notificações'],
        summary='Retorna a contagem de notificações não lidas',
    ),
)
class NotificationViewSet(
    mixins.ListModelMixin,
    GenericViewSet,
):
    """
    Endpoint para listagem e gerenciamento de notificações do usuário.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'lida'})

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


# ---------------------------------------------------------------------------- #
# Broadcast (employer)                                                           #
# ---------------------------------------------------------------------------- #

@extend_schema(tags=['Notificações'])
class BroadcastView(APIView):
    """
    Envia uma notificação para todos os usuários do employer do admin autenticado.
    Restrito ao proprietário do employer (Client.owners).
    """
    permission_classes = [permissions.IsAuthenticated, IsEmployerOwner]

    def post(self, request):
        serializer = BroadcastSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employer = request.user.profile.employer
        count = broadcast_to_employer(
            employer=employer,
            notification_type='broadcast',
            title=serializer.validated_data['title'],
            body=serializer.validated_data['body'],
            data=serializer.validated_data.get('data', {}),
        )
        return Response({'sent_to': count}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------- #
# Chave pública VAPID (sem autenticação — necessária para o PWA se registrar)  #
# ---------------------------------------------------------------------------- #

@extend_schema(tags=['Notificações'])
class VapidPublicKeyView(APIView):
    """
    Retorna a chave pública VAPID para que a PWA possa criar a subscription
    de Web Push no service worker.
    """
    permission_classes = []  # Público — nenhuma auth necessária
    authentication_classes = []

    def get(self, request):
        return Response({'vapid_public_key': settings.VAPID_PUBLIC_KEY})
