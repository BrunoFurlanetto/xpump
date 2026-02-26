"""
Management command para limpar entradas duplicadas/órfãs do django-apscheduler.

Problema:
    Quando o BackgroundScheduler (apps.py / scheduler.py) e o BlockingScheduler
    (runapscheduler) sobem juntos — ou após reinicializações parciais —
    podem surgir entradas duplicadas na tabela django_apscheduler_djangojob,
    fazendo o mesmo job disparar 2× ou 3× por execução.

Uso:
    python manage.py clean_duplicate_jobs            # dry-run (só lista)
    python manage.py clean_duplicate_jobs --delete   # apaga os duplicados
    python manage.py clean_duplicate_jobs --delete --executions  # apaga também o histórico
    python manage.py clean_duplicate_jobs --all      # apaga TODOS os jobs e execuções
"""
import logging

from django.core.management.base import BaseCommand
from django.db import transaction

logger = logging.getLogger(__name__)

# IDs canônicos que devem existir no banco — um único registro por ID.
CANONICAL_JOB_IDS = {
    'meal_reminder_check',
    'delete_old_job_executions',
}


class Command(BaseCommand):
    help = 'Detecta e remove entradas duplicadas/órfãs do django-apscheduler.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete',
            action='store_true',
            default=False,
            help='Executa a exclusão real (padrão: dry-run apenas lista).',
        )
        parser.add_argument(
            '--executions',
            action='store_true',
            default=False,
            help='Junto com --delete, remove também todo o histórico de execuções.',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            default=False,
            help='Remove TODOS os DjangoJob e DjangoJobExecution (útil para reset completo).',
        )

    # ------------------------------------------------------------------ #
    # Helpers de output                                                    #
    # ------------------------------------------------------------------ #

    def _ok(self, msg):
        self.stdout.write(self.style.SUCCESS(msg))

    def _warn(self, msg):
        self.stdout.write(self.style.WARNING(msg))

    def _err(self, msg):
        self.stdout.write(self.style.ERROR(msg))

    def _info(self, msg):
        self.stdout.write(msg)

    # ------------------------------------------------------------------ #
    # handle                                                               #
    # ------------------------------------------------------------------ #

    def handle(self, *args, **options):
        from django_apscheduler.models import DjangoJob, DjangoJobExecution

        delete = options['delete']
        delete_executions = options['executions']
        delete_all = options['all']

        # ── Reset completo ──────────────────────────────────────────────
        if delete_all:
            job_count = DjangoJob.objects.count()
            exec_count = DjangoJobExecution.objects.count()
            self._warn(
                f'--all: serão removidos {job_count} job(s) e {exec_count} execução(ões).'
            )
            with transaction.atomic():
                DjangoJobExecution.objects.all().delete()
                DjangoJob.objects.all().delete()
            self._ok('Reset completo realizado.')
            return

        # ── Lista todos os jobs ─────────────────────────────────────────
        all_jobs = list(DjangoJob.objects.order_by('id'))

        if not all_jobs:
            self._ok('Nenhum DjangoJob encontrado no banco. Nada a fazer.')
            return

        self._info(f'\n{"─"*60}')
        self._info(f'  DjangoJobs cadastrados: {len(all_jobs)}')
        self._info(f'{"─"*60}')

        for job in all_jobs:
            exec_count = DjangoJobExecution.objects.filter(job=job).count()
            next_run = job.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if job.next_run_time else '—'
            self._info(f'  id={job.id!r:45s}  next={next_run}  execuções={exec_count}')

        self._info(f'{"─"*60}\n')

        # ── Detecta duplicados e órfãos ─────────────────────────────────
        # Duplicados: IDs que repetem prefixo canônico (ex: "default.meal_reminder_check")
        # Órfãos:     IDs que não pertencem ao conjunto canônico

        to_delete = []
        seen_canonical = set()

        for job in all_jobs:
            job_id = job.id

            # Tenta mapear para um ID canônico
            canonical = None
            for cid in CANONICAL_JOB_IDS:
                if job_id == cid or job_id.endswith(f'.{cid}') or job_id.startswith(f'{cid}.'):
                    canonical = cid
                    break

            if canonical is None:
                # Não pertence a nenhum job canônico conhecido → órfão
                to_delete.append((job, 'ÓRFÃO (ID desconhecido)'))
            elif canonical in seen_canonical:
                # Já vimos este canônico → duplicado
                to_delete.append((job, f'DUPLICADO de {canonical!r}'))
            else:
                seen_canonical.add(canonical)

        # ── Mostra resultado da análise ─────────────────────────────────
        missing = CANONICAL_JOB_IDS - seen_canonical
        if missing:
            self._warn(f'  Jobs canônicos AUSENTES no banco: {missing}')
            self._warn('  → Eles serão recriados automaticamente no próximo start do scheduler.\n')

        if not to_delete:
            self._ok('Nenhuma entrada duplicada ou órfã encontrada. Tudo limpo!')
            return

        self._warn(f'Encontrado(s) {len(to_delete)} registro(s) para remoção:\n')
        for job, reason in to_delete:
            exec_count = DjangoJobExecution.objects.filter(job=job).count()
            self._warn(f'  [{reason}]  id={job.id!r}  execuções={exec_count}')

        # ── Exclusão ────────────────────────────────────────────────────
        if not delete:
            self._info(
                '\n[DRY-RUN] Nenhum dado foi alterado. '
                'Passe --delete para executar a exclusão.'
            )
            return

        with transaction.atomic():
            for job, reason in to_delete:
                exec_count = DjangoJobExecution.objects.filter(job=job).count()
                if delete_executions and exec_count:
                    DjangoJobExecution.objects.filter(job=job).delete()
                    self._info(f'  Execuções removidas para job {job.id!r}: {exec_count}')
                job.delete()
                self._ok(f'  Job removido: {job.id!r}  ({reason})')

        self._ok(
            f'\n{len(to_delete)} registro(s) removido(s). '
            'Reinicie o scheduler para recriar os jobs canônicos.'
        )
