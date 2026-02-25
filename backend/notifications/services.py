"""
Serviços de notificação:
  - send_webpush       → envia uma mensagem Web Push para uma PushSubscription
  - notify_user        → cria Notification no banco + dispara push para todos os devices
  - broadcast_to_employer → notifica todos os usuários de um employer
  - send_meal_reminders   → lembrete de refeição (consumido pelo APScheduler)
"""
import json
import logging
from datetime import time as dtime, timedelta as td

from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone

try:
    from django_apscheduler.util import close_old_connections
except ImportError:
    def close_old_connections(fn):  # fallback para ambientes sem django_apscheduler
        return fn

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
# Job agendado — lembrete de refeição (executa a cada 10 minutos)              #
# O decorator @close_old_connections garante que conexões DB obsoletas          #
# sejam fechadas antes e depois da execução do job.                             #
# ---------------------------------------------------------------------------- #

@close_old_connections
def send_meal_reminders():
    """
    Executa a cada 10 minutos e verifica se há algum intervalo de MealConfig
    atingindo um ponto de lembrete:

      • Meio do intervalo  →  start + (end − start) / 2
      • 30 minutos antes do fim →  end − 30 min

    Tolerância de ±5 min (metade do intervalo de execução) para absorver
    pequenas variações no disparo do scheduler.

    Envia notificação somente para usuários que ainda NÃO registraram nenhuma
    Meal do tipo correspondente no dia atual. Isso cobre:
      - Registro normal (com ou sem foto)
      - Registro de jejum (fasting=True, sem MealProof)
    """
    from nutrition.models import MealConfig

    TOLERANCE = td(minutes=5)

    # ------------------------------------------------------------------ #
    # Helpers de tempo                                                     #
    # ------------------------------------------------------------------ #

    def to_td(t: dtime) -> td:
        return td(hours=t.hour, minutes=t.minute, seconds=t.second)

    def to_time(delta: td) -> dtime:
        total = int(delta.total_seconds()) % 86400
        h, rem = divmod(total, 3600)
        m, s = divmod(rem, 60)
        return dtime(h, m, s)

    def is_near(target: dtime, current: dtime, tolerance: td) -> bool:
        diff = abs(to_td(current) - to_td(target))
        if diff > td(hours=12):
            diff = td(hours=24) - diff
        return diff <= tolerance

    # ------------------------------------------------------------------ #
    # Horário local e configs                                              #
    # ------------------------------------------------------------------ #

    now_local = timezone.localtime(timezone.now())
    today = now_local.date()
    current_time = now_local.time()

    logger.info('[meal_reminder] Verificando às %s', current_time.strftime('%H:%M:%S'))

    configs = list(MealConfig.objects.all())
    if not configs:
        logger.info('[meal_reminder] Nenhum MealConfig cadastrado. Pulando.')
        return

    triggered: list[tuple] = []

    for config in configs:
        start_td = to_td(config.interval_start)
        end_td = to_td(config.interval_end)

        if end_td <= start_td:          # intervalo cruza meia-noite
            end_td += td(hours=24)

        # meio do intervalo: start + (end - start) / 2
        midpoint = to_time(start_td + (end_td - start_td) / 2)
        thirty_before_end = to_time(end_td - td(minutes=30))

        logger.debug(
            '[meal_reminder] "%s": start=%s end=%s midpoint=%s 30_antes=%s agora=%s',
            config.meal_name,
            config.interval_start.strftime('%H:%M'),
            config.interval_end.strftime('%H:%M'),
            midpoint.strftime('%H:%M:%S'),
            thirty_before_end.strftime('%H:%M:%S'),
            current_time.strftime('%H:%M:%S'),
        )

        if is_near(midpoint, current_time, TOLERANCE):
            triggered.append((config, 'meio do intervalo'))
        elif is_near(thirty_before_end, current_time, TOLERANCE):
            triggered.append((config, '30 min antes do fim'))

    if not triggered:
        logger.info('[meal_reminder] Nenhum intervalo ativo agora. Nada a enviar.')
        return

    # ------------------------------------------------------------------ #
    # Para cada config disparada, notifica usuários sem registro          #
    # ------------------------------------------------------------------ #

    for config, trigger_label in triggered:
        logger.info(
            '[meal_reminder] Disparando "%s" (%s).',
            config.meal_name, trigger_label,
        )

        users_already_registered_ids = set(
            User.objects.filter(
                meals__meal_type=config,
                meals__meal_time__date=today,
            ).distinct().values_list('pk', flat=True)
        )

        users_to_remind = (
            User.objects
            .filter(profile__isnull=False)
            .exclude(pk__in=users_already_registered_ids)
            .select_related('profile')
        )

        count = 0
        for user in users_to_remind:
            try:
                notify_user(
                    user=user,
                    notification_type='meal_reminder',
                    title=f'Hora do(a) {config.get_meal_name_display()}! 🍽️',
                    body=(
                        f'Faltam 30 minutos para encerrar o horário de '
                        f'{config.get_meal_name_display()} '
                        f'({config.interval_start.strftime("%H:%M")}–'
                        f'{config.interval_end.strftime("%H:%M")}). '
                        f'Não esqueça de registrar sua refeição!'
                        if trigger_label == '30 min antes do fim'
                        else
                        f'Está na hora do(a) {config.get_meal_name_display()}! '
                        f'Registre sua refeição '
                        f'({config.interval_start.strftime("%H:%M")}–'
                        f'{config.interval_end.strftime("%H:%M")}).'
                    ),
                    data={
                        'meal_config_id': config.pk,
                        'meal_name': config.meal_name,
                        'trigger': trigger_label,
                    },
                )
                count += 1
            except Exception as exc:  # noqa: BLE001
                logger.error(
                    '[meal_reminder] Erro ao enviar para user_id=%s: %s', user.pk, exc,
                )

        logger.info(
            '[meal_reminder] "%s" (%s): %d notificações enviadas.',
            config.meal_name, trigger_label, count,
        )
