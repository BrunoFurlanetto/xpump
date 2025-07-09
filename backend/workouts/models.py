from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models

from status.models import Status


class CheckinTypes(models.TextChoices):
    PHOTO = 'PHOTO', 'Foto'
    VIDEO = 'VIDEO', 'Vídeo'
    GEOLOCATION = 'GEOLOCATION', 'Geolocalização'


class WorkoutCheckin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    check_in_type = models.CharField(max_length=100, choices=CheckinTypes.choices)
    image_proof = models.ImageField(upload_to='workout_checkins', null=True, blank=True)
    video_proof = models.FileField(
        upload_to='workout_checkins',
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['mp4'],
                message='Apenas arquivos de vídeo MP4 são permitidos.'
            )
        ],
        help_text='Formatos suportados: MP4'
    )
    location = models.CharField(max_length=100, null=True, blank=True)
    comments = models.TextField(blank=True)
    workout_date = models.DateTimeField()
    validation_status = models.ForeignKey(Status, on_delete=models.PROTECT)
    base_points = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f'Workout check-in for {self.user}'

    def clean(self):
        if self.check_in_type not in dict(CheckinTypes.choices):
            raise ValueError(f'{self.check_in_type} is not a valid check-in type.')

    def save(self, *args, **kwargs):
        self.clean()

        if self.check_in_type == 'PHOTO' and not self.image_proof:
            raise ValidationError('With check-in of type PHOTO, needed an image proof')

        if self.check_in_type == 'VIDEO' and not self.video_proof:
            raise ValidationError('With check-in of type VIDEO, needed an video proof')

        if self.check_in_type == 'GEOLOCATION' and not self.location:
            raise ValidationError('With check-in of type GEOLOCATION, needed a location proof')
        
        super().save(*args, **kwargs)
