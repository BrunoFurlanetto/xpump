from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nutrition', '0005_meal_groups'),
    ]

    operations = [
        migrations.AddField(
            model_name='meal',
            name='broke_diet',
            field=models.BooleanField(default=False),
        ),
    ]
