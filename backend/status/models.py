from django.core.exceptions import ValidationError
from django.db import models
import importlib


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
    app_name = models.CharField(max_length=120, choices=TargetApp.choices)
    action = models.CharField(max_length=120, choices=StatusAction.choices)

    class Meta:
        unique_together = ('app_name', 'action', 'is_active')
        ordering = ['app_name', 'action']

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        related_models = {
            TargetApp.WORKOUT: ('backend.workouts.models', 'WorkoutCheckin'),
            TargetApp.NUTRITION: ('backend.nutrition.models', 'Meal'),
            # TargetApp.COMMENT: ('backend.comments.models', 'Comment'),
        }
        model_info = related_models.get(self.app_name)

        if model_info:
            module_name, class_name = model_info
            module = importlib.import_module(module_name)
            RelatedModel = getattr(module, class_name)
            related_objs = RelatedModel.objects.filter(status=self)

            if related_objs.exists():
                substitute = Status.objects.filter(
                    is_active=True,
                    action=self.action,
                    app_name=self.app_name
                ).exclude(id=self.id)

                if not substitute.exists():
                    raise ValidationError(f"Cannot delete status '{self.name}' because it is in use and no substitute status is available.")

                related_objs.update(status=substitute.first())

        super().delete(*args, **kwargs)
