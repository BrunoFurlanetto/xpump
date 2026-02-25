from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notificações'

    def ready(self):
        import notifications.signals  # noqa: F401 — conecta os signal handlers

        import os
        import sys

        # Management commands não precisam do scheduler em background.
        # 'runapscheduler' sobe o próprio BlockingScheduler de forma dedicada.
        SKIP_COMMANDS = {
            'migrate', 'makemigrations', 'check', 'test', 'shell',
            'collectstatic', 'createsuperuser', 'dbshell', 'showmigrations',
            'runapscheduler', 'send_test_notification', 'inspectdb',
        }
        if sys.argv[1:2] and sys.argv[1] in SKIP_COMMANDS:
            return

        # O guard RUN_MAIN evita duplo start no autoreloader do runserver.
        if os.environ.get('RUN_MAIN') != 'true':
            from notifications.scheduler import start
            start()
