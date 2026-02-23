"""
Serviços de notificação:
  - send_webpush       → envia uma mensagem Web Push para uma PushSubscription
  - notify_user        → cria Notification no banco + dispara push para todos os devices
  - broadcast_to_employer → notifica todos os usuários de um employer
  - send_meal_reminders   → lembrete de refeição (consumido pelo APScheduler)
"""
import json
import logging

from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------- #
# Helpers de WebPush                                                             #
# ---------------------------------------------------------------------------- #

def _build_vapid_claims():
    return {
        'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}',
    }


def send_webpush(subscription, payload: dict) -> bool:
    """
    Envia um payload Web Push para a subscription informada.
    Retorna True em caso de sucesso e False em caso de falha.
    Remove automaticamente subscriptions obsoletas (HTTP 410 Gone).
    """
    try:
        from pywebpush import webpush, WebPushException

        webpush(
            subscription_info={
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.p256dh,
                    'auth': subscription.auth,
                },
            },
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims=_build_vapid_claims(),
        )
        return True

    except Exception as exc:  # noqa: BLE001
        # Import aqui para evitar erro caso pywebpush não esteja instalado
        try:
            from pywebpush import WebPushException
            if isinstance(exc, WebPushException):
                response = exc.response
                if response is not None and response.status_code == 410:
                    # Subscription expirada/cancelada — removida silenciosamente
                    logger.info(
                        'PushSubscription id=%s expirada (410). Removendo.', subscription.pk
                    )
                    subscription.delete()
                    return False
                logger.warning(
                    'WebPushException para subscription id=%s: %s', subscription.pk, exc
                )
            else:
                raise
        except ImportError:
            pass
        logger.error('Erro ao enviar WebPush para subscription id=%s: %s', subscription.pk, exc)
        return False


# ---------------------------------------------------------------------------- #
# Serviços de alto nível                                                         #
# ---------------------------------------------------------------------------- #

def notify_user(user: User, notification_type: str, title: str, body: str,
                data: dict = None, employer=None) -> 'Notification':
    """
    Cria um registro de Notification para o usuário e envia WebPush para
    todos os devices registrados.
    """
    from .models import Notification, PushSubscription

    notification = Notification.objects.create(
        user=user,
        employer=employer,
        notification_type=notification_type,
        title=title,
        body=body,
        data=data or {},
    )

    payload = {
        'title': title,
        'body': body,
        'type': notification_type,
        'data': data or {},
        'notification_id': notification.pk,
    }

    subscriptions = PushSubscription.objects.filter(user=user)
    for sub in subscriptions:
        send_webpush(sub, payload)

    return notification


def broadcast_to_employer(employer, notification_type: str, title: str, body: str,
                          data: dict = None) -> int:
    """
    Envia uma notificação para todos os usuários do employer.
    Retorna a quantidade de notificações criadas.
    """
    users = User.objects.filter(profile__employer=employer)
    count = 0
    for user in users:
        notify_user(user, notification_type, title, body, data=data, employer=employer)
        count += 1
    return count


# ---------------------------------------------------------------------------- #
# Job agendado — lembrete de refeição                                            #
# ---------------------------------------------------------------------------- #

def send_meal_reminders():
    """
    Envia lembretes para usuários que ainda não registraram refeição nas
    últimas 4 horas. Esta função é executada pelo APScheduler (runapscheduler).
    """
    from django_apscheduler import util as apscheduler_util

    @apscheduler_util.close_old_connections
    def _inner():
        from nutrition.models import Meal

        cutoff = timezone.now() - timezone.timedelta(hours=4)
        # Usuários que têm pelo menos um meal registrado (activos na plataforma)
        active_user_ids = Meal.objects.values_list('user_id', flat=True).distinct()
        # Desses, quais não registraram nenhuma refeição nas últimas 4h
        recent_user_ids = Meal.objects.filter(
            meal_time__gte=cutoff
        ).values_list('user_id', flat=True).distinct()

        users_to_remind = User.objects.filter(
            id__in=active_user_ids
        ).exclude(
            id__in=recent_user_ids
        )

        count = 0
        for user in users_to_remind:
            try:
                notify_user(
                    user=user,
                    notification_type='meal_reminder',
                    title='Hora de registrar sua refeição! 🍽️',
                    body='Não se esqueça de registrar sua refeição para manter sua sequência.',
                )
                count += 1
            except Exception as exc:  # noqa: BLE001
                logger.error('Erro ao enviar lembrete para user id=%s: %s', user.pk, exc)

        logger.info('Lembretes de refeição enviados para %d usuários.', count)

    _inner()
