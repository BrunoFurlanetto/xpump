from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0014_remove_gamificationbonus_gamificatio_user_id_3ed35b_idx_and_mor'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gamificationsettings',
            name='workout_minutes',
            field=models.IntegerField(default=30, help_text='Minutos de treino que equivalem a um bloco de pontuação'),
        ),
        migrations.AlterField(
            model_name='gamificationsettings',
            name='workout_xp',
            field=models.IntegerField(default=1, help_text='XP concedido por cada bloco completo de treino'),
        ),
    ]
