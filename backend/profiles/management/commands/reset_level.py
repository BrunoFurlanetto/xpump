# python
from django.core.management.base import BaseCommand
from profiles.models import Profile


class Command(BaseCommand):
    help = 'Set all Profile.level to 0'

    def handle(self, *args, **options):
        updated = Profile.objects.all().update(level=0)
        self.stdout.write(self.style.SUCCESS(f'Set level=0 for {updated} profiles.'))
