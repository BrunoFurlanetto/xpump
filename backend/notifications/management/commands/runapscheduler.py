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
from apscheduler.triggers.interval import IntervalTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

from notifications.services import send_meal_reminders

logger = logging.getLogger(__name__)


@util.close_old_connections
def delete_old_job_executions(max_age: int = 604_800):
    """Remove registros de execuções antigas do banco (padrão: 7 dias)."""
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


class Command(BaseCommand):
    help = 'Inicia o APScheduler para tarefas agendadas de notificações.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--run-now',
            action='store_true',
            help='Executa send_meal_reminders imediatamente ao iniciar (útil para testes).',
        )

    def handle(self, *args, **options):
        from django_apscheduler.models import DjangoJob

        # Para o BackgroundScheduler iniciado pelo AppConfig.ready() se estiver rodando,
        # pois este command assume controle exclusivo do scheduler.
        try:
            from notifications.scheduler import scheduler as bg_scheduler
            if bg_scheduler.running:
                bg_scheduler.shutdown(wait=False)
                logger.info('BackgroundScheduler parado para ceder lugar ao BlockingScheduler.')
        except Exception:
            pass

        # Executa imediatamente se --run-now foi passado
        if options.get('run_now'):
            self.stdout.write(self.style.WARNING('--run-now: executando send_meal_reminders...'))
            try:
                send_meal_reminders()
                self.stdout.write(self.style.SUCCESS('--run-now: concluído.'))
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'--run-now: erro — {exc}'))

        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), 'default')

        # Limpa entradas antigas do job no banco para evitar conflito de
        # referência entre versões anteriores (ex: job armazenado como string)
        DjangoJob.objects.filter(id='meal_reminder_check').delete()

        # ------------------------------------------------------------------ #
        # Job: lembrete de refeição — roda a cada 10 minutos                  #
        # ------------------------------------------------------------------ #
        scheduler.add_job(
            send_meal_reminders,
            trigger=IntervalTrigger(minutes=10),
            id='meal_reminder_check',
            max_instances=1,
            replace_existing=True,
            coalesce=True,               # se atrasou, roda 1x apenas (não recupera)
            misfire_grace_time=60 * 5,   # tolerância de 5 min para execuções atrasadas
        )
        logger.info("Job registrado: 'meal_reminder_check' (a cada 10 minutos).")
        self.stdout.write(f"  → meal_reminder_check: a cada 10 minutos")

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
            self.stdout.write(self.style.SUCCESS('Iniciando APScheduler (processo dedicado)...'))
            scheduler.start()
        except KeyboardInterrupt:
            logger.info('Encerrando APScheduler...')
            scheduler.shutdown()
            self.stdout.write(self.style.SUCCESS('APScheduler encerrado com sucesso.'))
