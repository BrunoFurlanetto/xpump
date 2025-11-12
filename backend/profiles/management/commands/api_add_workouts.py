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

        # prepare a small valid 1x1 PNG image (non-empty) for proof_files
        png_b64 = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAA"
            "SUVORK5CYII="
        )
        image_bytes = base64.b64decode(png_b64)

        def make_dummy_file():
            """Return a fresh SimpleUploadedFile instance with the 1x1 PNG bytes."""
            return SimpleUploadedFile("proof.png", image_bytes, content_type="image/png")

        for profile in qs:
            user = profile.user
            # create access token for user
            token = RefreshToken.for_user(user)
            access = str(token.access_token)
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

            for i in range(per_profile):
                # random duration between 20 and 90 minutes
                minutes = random.randint(20, 90)
                duration_str = str(timedelta(minutes=minutes))  # e.g. '1:00:00'
                workout_date = (timezone.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23)))

                # create a fresh file instance per request (the test client can consume file objects)
                dummy_file = make_dummy_file()

                data = {
                    'comments': f'Auto-generated workout #{i+1}',
                    'workout_date': workout_date.isoformat(),
                    'duration': duration_str,
                    'proof_files': [dummy_file],
                }

                if dry_run:
                    self.stdout.write(f"[dry-run] would POST {url} for user {user.username}: {data}")
                    created += 1
                    continue

                # ensure multipart so files are uploaded properly
                response = client.post(url, data, format='multipart')

                if response.status_code == 201:
                    created += 1
                else:
                    failures += 1
                    self.stdout.write(self.style.ERROR(
                        f"Failed for user={user.username}: status={response.status_code} resp={response.data}"
                    ))

        self.stdout.write(self.style.SUCCESS(f"Created: {created}. Failures: {failures}."))
