from django.contrib.auth.models import User
from django.db import models


class NotificationType(models.TextChoices):
    SOCIAL_LIKE = 'social_like', 'Curtiu seu post'
    SOCIAL_COMMENT = 'social_comment', 'Comentou no seu post'
    NUTRITION_PLAN_UPDATED = 'nutrition_plan_updated', 'Plano nutricional atualizado'
    MEAL_REMINDER = 'meal_reminder', 'Lembrete de refeição'
    BROADCAST = 'broadcast', 'Aviso geral'


class PushSubscription(models.Model):
    """Armazena a subscription de Web Push de um dispositivo de um usuário."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
        verbose_name='Usuário',
    )
    endpoint = models.TextField(unique=True, verbose_name='Endpoint')
    p256dh = models.TextField(verbose_name='Chave p256dh')
    auth = models.TextField(verbose_name='Auth token')
    user_agent = models.CharField(
        max_length=512,
        blank=True,
        null=True,
        verbose_name='User-Agent',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Subscription Push'
        verbose_name_plural = 'Subscriptions Push'
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.endpoint[:60]}…"


class Notification(models.Model):
    """Notificação persistida no banco para um usuário."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Usuário',
    )
    # Permite associar ao employer para broadcast; nullable para notificações pessoais
    employer = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Employer',
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        verbose_name='Tipo',
    )
    title = models.CharField(max_length=255, verbose_name='Título')
    body = models.TextField(verbose_name='Mensagem')
    data = models.JSONField(default=dict, blank=True, verbose_name='Dados extras')
    is_read = models.BooleanField(default=False, verbose_name='Lida')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criada em')

    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['employer', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.user.username} — {self.title}"
