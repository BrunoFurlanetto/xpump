"""
Management command to sync notification preferences for all users.

Creates NotificationPreference for users who don't have one yet.

Usage:
    python manage.py sync_notification_preferences
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from notifications.models import NotificationPreference


class Command(BaseCommand):
    """Create notification preferences for all users without them."""
    
    help = 'Create NotificationPreference for all users who don\'t have one'

    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write('Syncing notification preferences...\n')
        
        # Get all users
        all_users = User.objects.all()
        total_users = all_users.count()
        
        # Get users who already have preferences
        users_with_prefs = NotificationPreference.objects.values_list('user_id', flat=True)
        
        # Find users without preferences
        users_without_prefs = all_users.exclude(id__in=users_with_prefs)
        missing_count = users_without_prefs.count()
        
        if missing_count == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'All {total_users} users already have notification preferences!'
                )
            )
            return
        
        # Create preferences for users who don't have them
        created_count = 0
        for user in users_without_prefs:
            NotificationPreference.objects.create(user=user)
            created_count += 1
            
            if created_count % 100 == 0:
                self.stdout.write(f'  Created {created_count}/{missing_count} preferences...')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} notification preferences!'
            )
        )
        self.stdout.write(
            f'Total users: {total_users}, With preferences: {total_users}'
        )
