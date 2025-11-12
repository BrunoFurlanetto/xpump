from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
import random

from clients.models import Client
from authentication.serializer import UserSerializer


class Command(BaseCommand):
    help = 'Create fake users and relate them randomly to existing clients. Usage: python manage.py create_users_for_clients -q 10'

    def add_arguments(self, parser):
        parser.add_argument(
            '-q', '--quantity',
            type=int,
            default=1,
            help='Total number of users to create (default: 1)'
        )
        parser.add_argument(
            '--per-client',
            action='store_true',
            help='Create the quantity for each existing client instead of total'
        )
        parser.add_argument(
            '--staff',
            action='store_true',
            help='Create users with is_staff=True'
        )

    def handle(self, *args, **options):
        qty = options.get('quantity') or 1
        per_client = options.get('per_client')

        if qty < 1:
            raise CommandError('quantity must be >= 1')

        try:
            from faker import Faker
        except ImportError:
            raise CommandError('Faker library is not installed. Please install it with "pip install Faker"')

        fake = Faker('pt_BR')

        clients = list(Client.objects.all())

        if not clients:
            raise CommandError('No clients found. Please create clients first.')

        if per_client:
            total_to_create = qty * len(clients)
        else:
            total_to_create = qty

        created = 0
        errors = 0

        for i in range(total_to_create):
            # choose client
            client = random.choice(clients)

            username = fake.unique.user_name()
            password = 'Password123'
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = fake.unique.company_email()
            client_code = str(client.client_code)

            payload = {
                'username': username,
                'email': email,
                'password': password,
                'password2': password,
                'first_name': first_name,
                'last_name': last_name,
                'client_code': client_code,
            }

            try:
                with transaction.atomic():
                    serializer = UserSerializer(data=payload)

                    if serializer.is_valid(raise_exception=True):
                        user = serializer.save()
                        created += 1
                        self.stdout.write(self.style.SUCCESS(f'[{created}/{total_to_create}] User created: {user.username} (client: {client.name})'))
            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f'Error creating user for client {client.name}: {e}'))

        self.stdout.write(self.style.SQL_TABLE(f'Created: {created} | Errors: {errors}'))

