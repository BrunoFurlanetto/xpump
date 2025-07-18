# Generated by Django 5.2.3 on 2025-07-12 18:15
import datetime

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0002_alter_workoutcheckin_video_proof'),
    ]

    operations = [
        migrations.AddField(
            model_name='workoutcheckin',
            name='duration',
            field=models.DurationField(default=datetime.timedelta(0)),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='workoutcheckin',
            name='base_points',
            field=models.FloatField(blank=True, editable=False, null=True),
        ),
    ]
