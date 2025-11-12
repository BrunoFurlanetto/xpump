from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

import random
from datetime import timedelta

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

        for profile in qs:
            user = profile.user
            token = RefreshToken.for_user(user)
            access = str(token.access_token)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

            for i in range(per_profile):
                meal_conf = random.choice(meal_types)
                # choose a time strictly inside the meal interval (avoid boundary equality)
                start = meal_conf.interval_start
                end = meal_conf.interval_end

                # compute interval in seconds
                start_seconds = start.hour * 3600 + start.minute * 60 + start.second
                end_seconds = end.hour * 3600 + end.minute * 60 + end.second
                total_seconds = end_seconds - start_seconds

                # if interval is too small, pick a small offset (30s) after start
                if total_seconds <= 2:
                    sec_offset = 30
                else:
                    sec_offset = random.randint(1, total_seconds - 1)

                base_dt = timezone.now().replace(hour=start.hour, minute=start.minute, second=0, microsecond=0)
                meal_time = base_dt + timedelta(seconds=sec_offset, days=-random.randint(0, 30))

                data = {
                    'meal_type': meal_conf.id,
                    'meal_time': meal_time.isoformat(),
                    'comments': f'Auto meal #{i+1}'
                }

                if dry_run:
                    self.stdout.write(f"[dry-run] would POST {url} for user {user.username}: {data}")
                    created += 1
                    continue

                response = client.post(url, data)

                if response.status_code == 201:
                    created += 1
                else:
                    failures += 1
                    self.stdout.write(self.style.ERROR(
                        f"Failed for user={user.username}: status={response.status_code} resp={response.data}"
                    ))

        self.stdout.write(self.style.SUCCESS(f"Created: {created}. Failures: {failures}."))
