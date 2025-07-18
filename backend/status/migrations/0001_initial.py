# Generated by Django 5.2.3 on 2025-07-09 20:32

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Status',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('app_name', models.CharField(choices=[('PUBLISHED', 'Publicado'), ('APPROVED', 'Aprovado'), ('UNDER_REVIEW', 'Sob revisão'), ('BLOCKED', 'Bloqueado'), ('REJECTED', 'Rejeitado'), ('PENDING', 'Pendente')], max_length=120)),
                ('action', models.CharField(choices=[('PUBLISHED', 'Publicado'), ('APPROVED', 'Aprovado'), ('UNDER_REVIEW', 'Sob revisão'), ('BLOCKED', 'Bloqueado'), ('REJECTED', 'Rejeitado'), ('PENDING', 'Pendente')], max_length=120)),
            ],
        ),
    ]
