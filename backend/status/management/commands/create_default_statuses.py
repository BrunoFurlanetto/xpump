"""
Django management command to create default status entries for the application.

This command creates the necessary Status objects for different apps (WORKOUT, NUTRITION)
with appropriate actions (PUBLISHED, APPROVED, UNDER_REVIEW, BLOCKED, REJECTED).

Usage:
    python manage.py create_default_statuses
"""

from django.core.management.base import BaseCommand
from status.models import Status, TargetApp, StatusAction


class Command(BaseCommand):
    help = 'Creates default status entries for workouts and nutrition'

    def handle(self, *args, **options):
        """
        Create default status entries for each app and action combination.
        Only creates statuses that don't already exist.
        """
        statuses_to_create = [
            # Workout statuses
            {
                'app_name': TargetApp.WORKOUT,
                'action': StatusAction.PUBLISHED,
                'name': 'Treino Publicado',
                'description': 'Treino publicado e visível para todos',
                'is_active': True
            },
            {
                'app_name': TargetApp.WORKOUT,
                'action': StatusAction.APPROVED,
                'name': 'Treino Aprovado',
                'description': 'Treino aprovado pelo administrador',
                'is_active': True
            },
            {
                'app_name': TargetApp.WORKOUT,
                'action': StatusAction.UNDER_REVIEW,
                'name': 'Treino em Revisão',
                'description': 'Treino aguardando revisão',
                'is_active': True
            },
            {
                'app_name': TargetApp.WORKOUT,
                'action': StatusAction.REJECTED,
                'name': 'Treino Rejeitado',
                'description': 'Treino rejeitado pelo administrador',
                'is_active': True
            },
            {
                'app_name': TargetApp.WORKOUT,
                'action': StatusAction.PENDING,
                'name': 'Treino Pendente',
                'description': 'Treino pendente de validação',
                'is_active': True
            },
            
            # Nutrition statuses
            {
                'app_name': TargetApp.NUTRITION,
                'action': StatusAction.PUBLISHED,
                'name': 'Refeição Publicada',
                'description': 'Refeição publicada e visível para todos',
                'is_active': True
            },
            {
                'app_name': TargetApp.NUTRITION,
                'action': StatusAction.APPROVED,
                'name': 'Refeição Aprovada',
                'description': 'Refeição aprovada pelo administrador',
                'is_active': True
            },
            {
                'app_name': TargetApp.NUTRITION,
                'action': StatusAction.UNDER_REVIEW,
                'name': 'Refeição em Revisão',
                'description': 'Refeição aguardando revisão',
                'is_active': True
            },
            {
                'app_name': TargetApp.NUTRITION,
                'action': StatusAction.REJECTED,
                'name': 'Refeição Rejeitada',
                'description': 'Refeição rejeitada pelo administrador',
                'is_active': True
            },
            {
                'app_name': TargetApp.NUTRITION,
                'action': StatusAction.PENDING,
                'name': 'Refeição Pendente',
                'description': 'Refeição pendente de validação',
                'is_active': True
            },
        ]

        created_count = 0
        skipped_count = 0

        for status_data in statuses_to_create:
            # Check if status already exists
            existing = Status.objects.filter(
                app_name=status_data['app_name'],
                action=status_data['action'],
                is_active=status_data['is_active']
            ).first()

            if existing:
                self.stdout.write(
                    self.style.WARNING(
                        f'⏭️  Status já existe: {status_data["name"]} '
                        f'({status_data["app_name"]} - {status_data["action"]})'
                    )
                )
                skipped_count += 1
            else:
                Status.objects.create(**status_data)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Status criado: {status_data["name"]} '
                        f'({status_data["app_name"]} - {status_data["action"]})'
                    )
                )
                created_count += 1

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS(f'📊 Resumo:'))
        self.stdout.write(self.style.SUCCESS(f'   ✅ Criados: {created_count}'))
        self.stdout.write(self.style.SUCCESS(f'   ⏭️  Ignorados (já existiam): {skipped_count}'))
        self.stdout.write(self.style.SUCCESS(f'   📦 Total: {len(statuses_to_create)}'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
