from django.core.management.base import BaseCommand
from django.db import transaction
from math import floor
import random

from profiles.models import Profile


class Command(BaseCommand):
    help = (
        "Randomize Profile.score for all profiles and set Profile.level using the formula:"
        " level = floor((xp / 6) ** (1 / 1.5)). Does not use the API."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--min",
            type=int,
            default=0,
            dest="min_xp",
            help="Minimum XP value to assign (inclusive).",
        )
        parser.add_argument(
            "--max",
            type=int,
            default=100,
            dest="max_xp",
            help="Maximum XP value to assign (inclusive).",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=None,
            help="Optional random seed for reproducible results.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry_run",
            help="Do everything except save changes to the database.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=500,
            dest="batch_size",
            help="How many profiles to update per DB transaction/bulk_update.",
        )

    def handle(self, *args, **options):
        min_xp = options["min_xp"]
        max_xp = options["max_xp"]
        seed = options.get("seed")
        dry_run = options.get("dry_run", False)
        batch_size = max(1, options.get("batch_size") or 500)

        if min_xp < 0 or max_xp < 0 or min_xp > max_xp:
            self.stderr.write(self.style.ERROR("Invalid min/max XP range."))
            return

        if seed is not None:
            random.seed(seed)

        qs = Profile.objects.all()
        total = qs.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("No profiles found."))
            return

        self.stdout.write(f"Processing {total} profiles (min={min_xp}, max={max_xp})...")

        updated = 0
        min_assigned = None
        max_assigned = None
        sum_assigned = 0

        buffer = []

        for profile in qs:
            xp = random.randint(min_xp, max_xp)

            # formula requested: level = floor((xp / 6) ** (1 / 1.5))
            level = 0
            try:
                if xp > 0:
                    level = floor((xp / 6) ** (1.0 / 1.5))
                else:
                    level = 0
            except Exception:
                level = 0

            # collect stats
            if min_assigned is None or xp < min_assigned:
                min_assigned = xp
            if max_assigned is None or xp > max_assigned:
                max_assigned = xp
            sum_assigned += xp

            profile.score = float(xp)
            profile.level = int(level)

            if dry_run:
                # Just print a few samples
                if updated < 5:
                    self.stdout.write(f"[dry-run] {profile.pk}: xp={xp} -> level={level}")
                updated += 1
                continue

            buffer.append(profile)
            updated += 1

            if len(buffer) >= batch_size:
                with transaction.atomic():
                    Profile.objects.bulk_update(buffer, ["score", "level"])
                buffer = []

        # flush remaining
        if not dry_run and buffer:
            with transaction.atomic():
                Profile.objects.bulk_update(buffer, ["score", "level"])

        # summary
        avg = (sum_assigned / total) if total else 0
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"Dry-run completed for {updated} profiles."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Updated {updated} profiles."))

        self.stdout.write(
            f"Assigned XP: min={min_assigned}, max={max_assigned}, avg={avg:.2f}"
        )
        self.stdout.write("Done.")

