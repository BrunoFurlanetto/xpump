from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from gamification.models import Season
from clients.models import Client


class Command(BaseCommand):
    help = 'Create a new season for a client'

    def add_arguments(self, parser):
        parser.add_argument(
            '--client',
            type=str,
            help='Client name (optional, creates for all clients if not specified)',
        )
        parser.add_argument(
            '--name',
            type=str,
            default='Season 2025',
            help='Season name',
        )
        parser.add_argument(
            '--months',
            type=int,
            default=12,
            help='Duration in months (default: 12)',
        )

    def handle(self, *args, **options):
        client_name = options.get('client')
        season_name = options['name']
        duration_months = options['months']

        # Get start and end dates
        start_date = timezone.now().date()
        # Calculate end date (approximately)
        end_date = start_date + timedelta(days=30 * duration_months)

        if client_name:
            # Create for specific client
            try:
                client = Client.objects.get(name__icontains=client_name)
                self._create_season(client, season_name, start_date, end_date)
            except Client.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Client "{client_name}" not found')
                )
                return
            except Client.MultipleObjectsReturned:
                self.stdout.write(
                    self.style.ERROR(f'Multiple clients found with name "{client_name}"')
                )
                return
        else:
            # Create for all clients
            clients = Client.objects.all()
            if not clients.exists():
                self.stdout.write(
                    self.style.ERROR('No clients found in database')
                )
                return
            
            for client in clients:
                self._create_season(client, season_name, start_date, end_date)

    def _create_season(self, client, season_name, start_date, end_date):
        try:
            season, created = Season.objects.get_or_create(
                client=client,
                start_date=start_date,
                end_date=end_date,
                defaults={
                    'name': f'{season_name} - {client.name}',
                    'description': f'Temporada automática criada para {client.name}',
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Season created for {client.name}: {season.name}'
                        f' ({start_date} to {end_date})'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'⚠️  Season already exists for {client.name}: {season.name}'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error creating season for {client.name}: {str(e)}')
            )
