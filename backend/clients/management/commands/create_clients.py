# backend/clients/management/commands/create_clients.py
import datetime
import re

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction

from clients.models import Client
from gamification.models import Season
from groups.models import Group
from profiles.models import Profile


class Command(BaseCommand):
    help = 'Create fake clients using Faker. Usage: python manage.py create_clients -q 5'

    def add_arguments(self, parser):
        parser.add_argument(
            '-q', '--quantity',
            type=int,
            default=1,
            help='Number of customers to create (default: 1)'
        )

    def _format_phone(self, raw):
        if not raw:
            return raw

        digits = re.sub(r'\D', '', raw)  # keep only digits
        # remove leading country code 55 if present

        if digits.startswith('55'):
            digits = digits[2:]

        if len(digits) < 3:  # not enough digits
            return raw

        ddd = digits[:2]
        rest = digits[2:]

        if len(rest) <= 4:
            return f'({ddd}) {rest}'

        formatted_rest = f'{rest[:-4]}-{rest[-4:]}'

        return f'({ddd}) {formatted_rest}'

    def handle(self, *args, **options):
        qty = options.get('quantity') or 1

        if qty < 1:
            raise CommandError('quantity must be >= 1')

        try:
            from faker import Faker
        except ImportError:
            raise CommandError('The `Faker` library is not installed. Install it: pip install Faker')

        fake = Faker('pt_BR')

        self.stdout.write(self.style.WARNING('Creating owner to client.'))

        created = 0
        errors = 0

        for i in range(qty):
            owner = User.objects.create_user(
                username=fake.unique.user_name(),
                email=fake.unique.email(),
                password='password123',
                first_name=fake.first_name(),
                last_name=fake.last_name()
            )

            cnpj = fake.cnpj()
            phone = self._format_phone(fake.phone_number())
            name = fake.company()
            contact_email = fake.unique.company_email()
            address = fake.address()


            try:
                with transaction.atomic():
                    group = Group.objects.create(name=name, owner=owner, created_by=owner, main=True)

                    client_data = {
                        'name': name,
                        'cnpj': cnpj,
                        'contact_email': contact_email,
                        'phone': phone,
                        'address': address,
                        'owners': owner,  # ForeignKey field
                        'main_group': group,  # ForeignKey field
                    }
                    client = Client.objects.create(**client_data)

                    # Add many-to-many relations after creating the client
                    client.groups.add(group)

                    self.stdout.write(self.style.NOTICE('Creating profile for owner user.'))
                    Profile.objects.create(user=owner, employer=client)
                    Season.objects.create(
                        client=client,
                        name=fake.word().capitalize() + ' Season',
                        start_date=datetime.date.today(),
                        end_date=datetime.date.today() + datetime.timedelta(days=180)
                    )
                created += 1
                self.stdout.write(
                    self.style.SUCCESS(f'[{created}/{qty}] Client created: {client.name} (CNPJ: {client.cnpj})'))
            except IntegrityError as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f'Error creating client: {e}'))
            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f'Unexpected error: {e}'))

        self.stdout.write(self.style.SQL_TABLE(f'Created: {created} | Errors: {errors}'))
