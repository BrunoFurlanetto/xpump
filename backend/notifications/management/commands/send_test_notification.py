"""
Envia uma notificação de teste para todos os usuários que possuem
ao menos uma PushSubscription registrada.

Uso:
    python manage.py send_test_notification
    python manage.py send_test_notification --title "Olá!" --body "Teste de push"
    python manage.py send_test_notification --user 42
"""
from django.core.management.base import BaseCommand

from notifications.models import PushSubscription
from notifications.services import notify_user


class Command(BaseCommand):
    help = 'Envia uma notificação WebPush de teste para usuários com subscription.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--title',
            type=str,
            default='🔔 Notificação de teste',
            help='Título da notificação (padrão: "🔔 Notificação de teste")',
        )
        parser.add_argument(
            '--body',
            type=str,
            default='Se você está vendo isso, as notificações push estão funcionando!',
            help='Corpo da notificação',
        )
        parser.add_argument(
            '--user',
            type=int,
            default=None,
            help='ID de um usuário específico (opcional; por padrão envia para todos)',
        )

    def handle(self, *args, **options):
        title = options['title']
        body = options['body']
        user_id = options['user']

        qs = PushSubscription.objects.select_related('user').distinct()

        if user_id:
            qs = qs.filter(user_id=user_id)

        user_ids = list(qs.values_list('user_id', flat=True).distinct())

        if not user_ids:
            self.stdout.write(self.style.WARNING('Nenhum usuário com PushSubscription encontrado.'))
            return

        self.stdout.write(f'Enviando para {len(user_ids)} usuário(s)...')

        success = 0
        errors = 0

        for uid in user_ids:
            try:
                sub = qs.filter(user_id=uid).first()
                notify_user(
                    user=sub.user,
                    notification_type='broadcast',
                    title=title,
                    body=body,
                    data={'test': True},
                )
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ user_id={uid} ({sub.user.username})')
                )
                success += 1
            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ user_id={uid} — {exc}')
                )
                errors += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Concluído: {success} enviados, {errors} erros.'))
