from django.apps import AppConfig


class SocialFeedConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'social_feed'

    def ready(self):
        """Import signals when the app is ready."""
        import social_feed.signals  # noqa

