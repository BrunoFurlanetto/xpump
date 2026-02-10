"""
Celery configuration for Xpump project.

This module configures Celery for asynchronous task processing,
including scheduled tasks (beat) for notifications.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure periodic tasks (Celery Beat)
app.conf.beat_schedule = {
    'send-workout-reminders': {
        'task': 'notifications.tasks.send_workout_reminders',
        'schedule': crontab(hour=8, minute=0),  # Every day at 8:00 AM
    },
    'send-meal-reminders-lunch': {
        'task': 'notifications.tasks.send_meal_reminders',
        'schedule': crontab(hour=12, minute=0),  # Every day at 12:00 PM
    },
    'send-meal-reminders-dinner': {
        'task': 'notifications.tasks.send_meal_reminders',
        'schedule': crontab(hour=18, minute=0),  # Every day at 6:00 PM
    },
    'check-group-ranking-changes': {
        'task': 'notifications.tasks.check_group_ranking_changes',
        'schedule': crontab(hour=21, minute=0),  # Every day at 9:00 PM
    },
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0, day_of_week=1),  # Every Monday at 3:00 AM
    },
}

app.conf.timezone = 'America/Sao_Paulo'


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery configuration."""
    print(f'Request: {self.request!r}')
