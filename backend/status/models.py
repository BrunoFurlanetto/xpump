from django.db import models


class TargetApp(models.TextChoices):
    WORKOUT = 'WORKOUT', 'Check-ins de treino'
    NUTRITION = 'NUTRITION', 'Posts de refeições'
    COMMENT = 'COMMENT', 'Comentários'


class StatusAction(models.TextChoices):
    PUBLISHED = 'PUBLISHED', 'Publicado'
    APPROVED = 'APPROVED', 'Aprovado'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Sob revisão'
    BLOCKED = 'BLOCKED', 'Bloqueado'
    REJECTED = 'REJECTED', 'Rejeitado'
    PENDING = 'PENDING', 'Pendente'


class Status(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    app_name = models.CharField(max_length=120, choices=StatusAction.choices)
    action = models.CharField(max_length=120, choices=StatusAction.choices)

    def __str__(self):
        return self.name
