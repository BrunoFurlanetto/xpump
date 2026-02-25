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

        # Permite desabilitar o scheduler via variável de ambiente.
        # Em produção/Docker, use SCHEDULER_ENABLED=false no server principal
        # e rode um processo dedicado com `python manage.py runapscheduler`.
        if os.environ.get('SCHEDULER_ENABLED', 'true').lower() == 'false':
            return

        # O guard RUN_MAIN evita duplo start no autoreloader do runserver.
        # RUN_MAIN=true significa que estamos no processo filho (Django real),
        # não no processo pai (autoreloader). Iniciamos APENAS no filho.
        # Sem RUN_MAIN (produção/Docker sem autoreload), iniciamos normalmente.
        run_main = os.environ.get('RUN_MAIN')
        if run_main is None or run_main == 'true':
            from notifications.scheduler import start
            start()
