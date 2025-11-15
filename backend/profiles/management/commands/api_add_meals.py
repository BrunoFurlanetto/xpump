from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.test import APIClient

import random
from datetime import timedelta
from zoneinfo import ZoneInfo

from profiles.models import Profile
from nutrition.models import MealConfig


class Command(BaseCommand):
    help = (
        "Create meal entries for every profile by calling the API endpoints."
        " Uses server-side JWT tokens and DRF APIClient (no external HTTP required)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--per-profile",
            type=int,
            default=1,
            help="How many meals to create per profile (default: 1)",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=None,
            help="Optional random seed for reproducible results",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do everything except save changes (will still call serializers but skips DB save)",
        )

    def handle(self, *args, **options):
        per_profile = max(1, options.get("per_profile", 1))
        seed = options.get("seed")
        dry_run = options.get("dry_run", False)

        if seed is not None:
            random.seed(seed)

        meal_types = list(MealConfig.objects.all())
        if not meal_types:
            self.stdout.write(self.style.ERROR("No MealConfig found. Create meal types before running."))

            return

        qs = Profile.objects.select_related('user').all()
        total = qs.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("No profiles found."))

            return

        client = APIClient()
        url = '/api/v1/meals/'

        created = 0
        failures = 0

        self.stdout.write(self.style.SUCCESS(f"Starting meal creation for {total} profiles..."))
        self.stdout.write(self.style.NOTICE(f"Creating {per_profile} meal(s) per profile"))

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No data will be saved"))

        profile_count = 0

        for profile in qs:
            profile_count += 1
            user = profile.user

            self.stdout.write(
                self.style.NOTICE(f"\n[{profile_count}/{total}] Processing user: {user.username} (ID: {user.id})")
            )

            # Authenticate once per profile to avoid token generation overhead
            client.force_authenticate(user=user)

            profile_created = 0

            for i in range(per_profile):
                meal_conf = random.choice(meal_types)
                start = meal_conf.interval_start
                end = meal_conf.interval_end

                # Sorteia uma data nos últimos 6 meses
                days_back = random.randint(0, 180)

                # Usa timezone de São Paulo explicitamente
                tz = ZoneInfo('America/Sao_Paulo')
                now_sao_paulo = timezone.now().astimezone(tz)
                base_dt = now_sao_paulo - timedelta(days=days_back)

                # Compute interval in seconds
                start_seconds = start.hour * 3600 + start.minute * 60 + start.second
                end_seconds = end.hour * 3600 + end.minute * 60 + end.second

                # Adiciona margem de segurança: 2 minutos após o início e 2 minutos antes do fim
                # para garantir que o horário caia dentro do intervalo mesmo após conversões de timezone
                start_seconds_safe = start_seconds + 120  # +2 minutos
                end_seconds_safe = end_seconds - 120      # -2 minutos

                total_seconds = end_seconds_safe - start_seconds_safe

                # Se o intervalo for muito pequeno (menos de 5 minutos), usa o meio do intervalo
                if total_seconds <= 300:
                    sec_offset = start_seconds + ((end_seconds - start_seconds) // 2)
                else:
                    # Escolhe um horário aleatório dentro do intervalo seguro
                    sec_offset = random.randint(start_seconds_safe, end_seconds_safe)

                # Cria o datetime com o horário sorteado no timezone de São Paulo
                meal_time = base_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                meal_time = meal_time + timedelta(seconds=sec_offset)

                # Validação: garante que o horário está dentro do intervalo
                meal_time_only = meal_time.time()
                if not (start <= meal_time_only <= end):
                    self.stdout.write(self.style.ERROR(
                        f"     ⚠ WARNING: Generated time {meal_time_only} is outside interval {start}-{end}, regenerating..."
                    ))
                    # Força um horário no meio do intervalo
                    mid_seconds = start_seconds + ((end_seconds - start_seconds) // 2)
                    meal_time = base_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                    meal_time = meal_time + timedelta(seconds=mid_seconds)

                # Garante que meal_time está no timezone correto antes de enviar
                if meal_time.tzinfo is None or meal_time.tzinfo != tz:
                    # Remove timezone info if present and re-add with correct timezone
                    meal_time = meal_time.replace(tzinfo=None)
                    meal_time = meal_time.replace(tzinfo=tz)

                data = {
                    'meal_type': meal_conf.id,
                    'meal_time': meal_time.isoformat(),  # Envia como ISO string com timezone
                    'comments': f'Auto meal #{i+1}'
                }

                self.stdout.write(
                    f"  → Meal {i+1}/{per_profile}: {meal_conf.get_meal_name_display()} at {meal_time.strftime('%Y-%m-%d %H:%M')} "
                    f"({days_back}d ago)"
                )

                if dry_run:
                    self.stdout.write(f"     [DRY-RUN] Would POST to {url}")
                    created += 1
                    profile_created += 1

                    continue

                response = client.post(url, data, format='json')

                if response.status_code == 201:
                    created += 1
                    profile_created += 1
                    self.stdout.write(self.style.SUCCESS(f"     ✓ Created successfully"))
                else:
                    failures += 1
                    self.stdout.write(self.style.ERROR(
                        f"     ✗ FAILED: status={response.status_code} | {response.data}"
                    ))

            # Remove authentication to be safe before next profile
            client.force_authenticate(user=None)

            self.stdout.write(
                self.style.SUCCESS(f"  Profile summary: {profile_created}/{per_profile} meals created")
            )

        self.stdout.write(self.style.SQL_TABLE("\n" + "="*70))
        self.stdout.write(self.style.SUCCESS(f"FINAL SUMMARY:"))
        self.stdout.write(self.style.SUCCESS(f"  Profiles processed: {profile_count}/{total}"))
        self.stdout.write(self.style.SUCCESS(f"  Meals created: {created}"))

        if failures > 0:
            self.stdout.write(self.style.ERROR(f"  Failures: {failures}"))

        self.stdout.write(self.style.SQL_TABLE("="*70))
