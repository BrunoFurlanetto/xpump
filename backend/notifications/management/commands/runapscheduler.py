"""
Management command para iniciar o APScheduler em processo dedicado.

Uso:
    python manage.py runapscheduler

Deve ser executado em paralelo ao servidor web (ex: via supervisor ou
Dockerfile CMD). Nunca iniciar dentro de uma view Django.
"""
import logging

from django.conf import settings
from django.core.management.base import BaseCommand

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

logger = logging.getLogger(__name__)


@util.close_old_connections
def delete_old_job_executions(max_age: int = 604_800):
    """Remove registros de execuções antigas do banco (padrão: 7 dias)."""
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


class Command(BaseCommand):
    help = 'Inicia o APScheduler para tarefas agendadas de notificações.'

    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), 'default')

        # ------------------------------------------------------------------ #
        # Job: lembrete de refeição                                            #
        # Horários configuráveis via settings.MEAL_REMINDER_HOURS             #
        # ------------------------------------------------------------------ #
        reminder_hours = getattr(settings, 'MEAL_REMINDER_HOURS', [11, 17])

        for hour in reminder_hours:
            job_id = f'meal_reminder_{hour}h'
            scheduler.add_job(
                'notifications.services:send_meal_reminders',
                trigger=CronTrigger(hour=str(hour), minute='0'),
                id=job_id,
                max_instances=1,
                replace_existing=True,
            )
            logger.info("Job registrado: '%s' (todo dia às %dh).", job_id, hour)

        # ------------------------------------------------------------------ #
        # Job: limpeza semanal do histórico de execuções                      #
        # ------------------------------------------------------------------ #
        scheduler.add_job(
            delete_old_job_executions,
            trigger=CronTrigger(day_of_week='mon', hour='0', minute='0'),
            id='delete_old_job_executions',
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Job registrado: 'delete_old_job_executions' (toda segunda às 00h).")

        try:
            self.stdout.write(self.style.SUCCESS('Iniciando APScheduler...'))
            scheduler.start()
        except KeyboardInterrupt:
            logger.info('Encerrando APScheduler...')
            scheduler.shutdown()
            self.stdout.write(self.style.SUCCESS('APScheduler encerrado com sucesso.'))
