"""
Management command to send a test notification to a user.

Usage:
    python manage.py send_test_notification <user_id>
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from notifications.services import NotificationService


class Command(BaseCommand):
    """Send a test notification to a specific user."""
    
    help = 'Send a test notification to a user by ID'

    def add_arguments(self, parser):
        parser.add_argument(
            'user_id',
            type=int,
            help='ID of the user to send notification to'
        )
        
        parser.add_argument(
            '--type',
            type=str,
            default='social',
            help='Type of notification (social, group, achievement, etc.)'
        )

    def handle(self, *args, **options):
        """Execute the command."""
        user_id = options['user_id']
        notification_type = options['type']
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise CommandError(f'User with ID {user_id} does not exist')
        
        # Create test notification
        notification = NotificationService.create_notification(
            user=user,
            notification_type=notification_type,
            title='Test Notification',
            message=f'This is a test notification of type "{notification_type}"',
            metadata={'test': True, 'source': 'management_command'}
        )
        
        if notification:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully sent test notification (ID: {notification.id}) to {user.username}'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'Notification was not sent - user preferences may have blocked it'
                )
            )
