from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

import random
import base64
from datetime import timedelta

from profiles.models import Profile


class Command(BaseCommand):
    help = (
        "Create workout check-ins for every profile by calling the API endpoints."
        " Uses server-side JWT tokens and DRF APIClient (no external HTTP required)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--per-profile",
            type=int,
            default=1,
            help="How many workout check-ins to create per profile (default: 1)",
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

        qs = Profile.objects.select_related('user').all()
        total = qs.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("No profiles found."))
            return

        client = APIClient()
        url = '/api/v1/workouts/'

        created = 0
        failures = 0

        self.stdout.write(self.style.SUCCESS(f"Starting workout creation for {total} profiles..."))
        self.stdout.write(self.style.NOTICE(f"Creating {per_profile} workout(s) per profile"))
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No data will be saved"))

        # prepare a small valid 1x1 PNG image (non-empty) for proof_files
        png_b64 = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAA"
            "SUVORK5CYII="
        )
        image_bytes = base64.b64decode(png_b64)

        def make_dummy_file():
            """Return a fresh SimpleUploadedFile instance with the 1x1 PNG bytes."""
            return SimpleUploadedFile("proof.png", image_bytes, content_type="image/png")

        profile_count = 0
        for profile in qs:
            profile_count += 1
            user = profile.user

            self.stdout.write(
                self.style.NOTICE(f"\n[{profile_count}/{total}] Processing user: {user.username} (ID: {user.id})")
            )

            # create access token for user
            token = RefreshToken.for_user(user)
            access = str(token.access_token)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

            profile_created = 0
            for i in range(per_profile):
                # random duration between 20 and 90 minutes
                minutes = random.randint(20, 90)
                duration_str = str(timedelta(minutes=minutes))  # e.g. '1:00:00'
                days_back = random.randint(0, 180)
                hours_back = random.randint(0, 23)
                workout_date = timezone.now() - timedelta(days=days_back, hours=hours_back)

                # create a fresh file instance per request (the test client can consume file objects)
                dummy_file = make_dummy_file()

                data = {
                    'comments': f'Auto-generated workout #{i+1}',
                    'workout_date': workout_date.isoformat(),
                    'duration': duration_str,
                    'proof_files': [dummy_file],
                }

                self.stdout.write(
                    f"  → Workout {i+1}/{per_profile}: {workout_date.strftime('%Y-%m-%d %H:%M')} "
                    f"({days_back}d ago) | Duration: {duration_str}"
                )

                if dry_run:
                    self.stdout.write(f"     [DRY-RUN] Would POST to {url}")
                    created += 1
                    profile_created += 1
                    continue

                # ensure multipart so files are uploaded properly
                response = client.post(url, data, format='multipart')

                if response.status_code == 201:
                    created += 1
                    profile_created += 1
                    self.stdout.write(self.style.SUCCESS(f"     ✓ Created successfully"))
                else:
                    failures += 1
                    self.stdout.write(self.style.ERROR(
                        f"     ✗ FAILED: status={response.status_code} | {response.data}"
                    ))

            self.stdout.write(
                self.style.SUCCESS(f"  Profile summary: {profile_created}/{per_profile} workouts created")
            )

        self.stdout.write(self.style.SQL_TABLE("\n" + "="*70))
        self.stdout.write(self.style.SUCCESS(f"FINAL SUMMARY:"))
        self.stdout.write(self.style.SUCCESS(f"  Profiles processed: {profile_count}/{total}"))
        self.stdout.write(self.style.SUCCESS(f"  Workouts created: {created}"))
        if failures > 0:
            self.stdout.write(self.style.ERROR(f"  Failures: {failures}"))
        self.stdout.write(self.style.SQL_TABLE("="*70))
