"""
Signal handlers para disparo automático de notificações.
Conectados em NotificationsConfig.ready().
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------- #
# Social Feed — Curtida em post                                                  #
# ---------------------------------------------------------------------------- #

@receiver(post_save, sender='social_feed.PostLike')
def on_post_like(sender, instance, created, **kwargs):
    if not created:
        return

    post = instance.post
    # Não notifica o autor se ele curtir o próprio post
    if instance.user == post.user:
        return

    try:
        from .services import notify_user
        notify_user(
            user=post.user,
            notification_type='social_like',
            title='Alguém curtiu seu post! ❤️',
            body=f'{instance.user.get_full_name() or instance.user.username} curtiu seu post.',
            data={'post_id': post.pk, 'liker_id': instance.user.pk},
        )
    except Exception as exc:  # noqa: BLE001
        logger.error('Erro ao notificar curtida (post_id=%s): %s', post.pk, exc)


# ---------------------------------------------------------------------------- #
# Social Feed — Comentário em post                                               #
# ---------------------------------------------------------------------------- #

@receiver(post_save, sender='social_feed.Comment')
def on_comment_created(sender, instance, created, **kwargs):
    if not created:
        return

    post = instance.post
    # Não notifica o autor se ele comentar no próprio post
    if instance.user == post.user:
        return

    try:
        from .services import notify_user
        notify_user(
            user=post.user,
            notification_type='social_comment',
            title='Novo comentário no seu post! 💬',
            body=f'{instance.user.get_full_name() or instance.user.username} comentou: "{instance.text[:80]}"',
            data={'post_id': post.pk, 'comment_id': instance.pk, 'commenter_id': instance.user.pk},
        )
    except Exception as exc:  # noqa: BLE001
        logger.error('Erro ao notificar comentário (post_id=%s): %s', post.pk, exc)


# ---------------------------------------------------------------------------- #
# Nutrition — Plano nutricional atualizado                                       #
# ---------------------------------------------------------------------------- #

@receiver(post_save, sender='nutrition.NutritionPlan')
def on_nutrition_plan_saved(sender, instance, created, **kwargs):
    """
    Notifica os usuários vinculados ao plano nutricional.

    ATENÇÃO: Para que esta notificação funcione, adicione ao model Profile
    um campo FK para NutritionPlan, ex:
        nutrition_plan = models.ForeignKey(
            'nutrition.NutritionPlan',
            null=True, blank=True,
            on_delete=models.SET_NULL,
            related_name='users',
        )
    Após adicionar o campo e rodar a migration, descomente o bloco abaixo.
    """
    # --- Descomente após adicionar Profile.nutrition_plan ---
    # try:
    #     from django.contrib.auth.models import User
    #     from .services import notify_user
    #
    #     users = User.objects.filter(profile__nutrition_plan=instance)
    #     action = 'criado' if created else 'atualizado'
    #     for user in users:
    #         notify_user(
    #             user=user,
    #             notification_type='nutrition_plan_updated',
    #             title=f'Plano nutricional {action}! 🥗',
    #             body=f'Seu plano "{instance.title}" foi {action}.',
    #             data={'nutrition_plan_id': instance.pk},
    #         )
    # except Exception as exc:
    #     logger.error('Erro ao notificar atualização do plano id=%s: %s', instance.pk, exc)
    pass
