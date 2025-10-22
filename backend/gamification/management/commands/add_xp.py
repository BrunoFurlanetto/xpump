# python
# Arquivo: `backend/gamification/management/commands/test_add_xp.py`
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()

try:
    from gamification.services import Gamification
except Exception:
    try:
        from gamification import Gamification
    except Exception:
        try:
            from backend.gamification.services import Gamification
        except Exception:
            Gamification = None


class Command(BaseCommand):
    help = 'Tests the addition of XP via Gamification().add_xp(user). Usage: python manage.py test_add_xp --username USERNAME [--amount N]'

    def add_arguments(self, parser):
        parser.add_argument('--username', '-u', type=str, help='Username')
        parser.add_argument('--user-id', '-i', type=int, help='ID for user')
        parser.add_argument('--amount', '-a', type=int, help='Amount of XP to add')

    def handle(self, *args, **options):
        username = options.get('username')
        user_id = options.get('user_id')
        amount = options.get('amount')

        if not amount:
            raise CommandError('Provide --amount')

        if not username and not user_id:
            raise CommandError('Provide --username or --user-id')

        try:
            user = User.objects.get(pk=user_id) if user_id else User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError('User not found')

        if Gamification is None:
            raise CommandError('Could not import Gamification. Adjust the import command.')
        print(user)
        Gamification().add_xp(user, amount)

        self.stdout.write(self.style.SUCCESS(f'XP added for {user.username}.'))
