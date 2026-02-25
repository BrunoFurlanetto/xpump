"""
Scheduler de notificações do Xpump.

Iniciado automaticamente via NotificationsConfig.ready() junto com o processo
Django. Usa BackgroundScheduler (thread em background) com DjangoJobStore para
persistência e histórico de execuções no Admin.

ATENÇÃO: Em produção com múltiplos workers (gunicorn/uwsgi), cada worker sobe
seu próprio scheduler. Para evitar execuções duplicadas, use a variável de
ambiente SCHEDULER_ENABLED=false em workers adicionais e deixe apenas o worker
principal com SCHEDULER_ENABLED=true, ou use o management command
`python manage.py runapscheduler` em processo dedicado com BlockingScheduler.
"""
import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler import util

from django.conf import settings

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)


@util.close_old_connections
def _delete_old_job_executions(max_age: int = 604_800):
    """Remove registros de execuções com mais de 7 dias do banco."""
    from django_apscheduler.models import DjangoJobExecution
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


def start():
    """
    Registra os jobs e inicia o scheduler em background.
    Chamado por NotificationsConfig.ready() e pelo management command runapscheduler.
    """
    if scheduler.running:
        logger.debug('Scheduler já está rodando. Ignorando chamada duplicada.')
        return

    # Permite desabilitar via variável de ambiente (útil em workers adicionais)
    if os.environ.get('SCHEDULER_ENABLED', 'true').lower() == 'false':
        logger.info('Scheduler desabilitado via SCHEDULER_ENABLED=false. Pulando.')
        return

    # Adiciona job store agora — só aqui tocamos o banco pela primeira vez.
    # Guard para o caso de start() ser chamado uma segunda vez após stop().
    if 'default' not in scheduler._jobstores:
        scheduler.add_jobstore(DjangoJobStore(), 'default')

    # ------------------------------------------------------------------ #
    # Job: lembrete de refeição — roda a cada 10 minutos                  #
    # Verifica MealConfig e envia push para usuários sem registro hoje.   #
    # ------------------------------------------------------------------ #
    from notifications.services import send_meal_reminders

    scheduler.add_job(
        send_meal_reminders,
        trigger=IntervalTrigger(minutes=10),
        id='meal_reminder_check',
        name='Lembrete de refeição (a cada 10 min)',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=60 * 5,
    )
    logger.info("Job registrado: 'meal_reminder_check' (a cada 10 minutos).")

    # ------------------------------------------------------------------ #
    # Job: limpeza semanal do histórico de execuções                      #
    # ------------------------------------------------------------------ #
    scheduler.add_job(
        _delete_old_job_executions,
        trigger=CronTrigger(day_of_week='mon', hour='0', minute='0'),
        id='delete_old_job_executions',
        name='Limpeza de execuções antigas',
        replace_existing=True,
        max_instances=1,
    )
    logger.info("Job registrado: 'delete_old_job_executions' (toda segunda às 00h).")

    try:
        scheduler.start()
        logger.info('Scheduler de notificações iniciado em background.')
    except Exception as exc:
        logger.error('Erro ao iniciar scheduler: %s', exc)
