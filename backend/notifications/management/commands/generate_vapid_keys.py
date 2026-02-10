"""
Management command to generate VAPID keys for Web Push notifications.

Usage:
    python manage.py generate_vapid_keys
"""
from django.core.management.base import BaseCommand
from vapid import Vapid


class Command(BaseCommand):
    """Generate VAPID public and private keys for Web Push."""
    
    help = 'Generate VAPID keys for Web Push notifications'

    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write(self.style.WARNING(
            '\nGenerating VAPID keys for Web Push notifications...\n'
        ))
        
        # Generate new VAPID keys
        vapid = Vapid()
        vapid.generate_keys()
        
        # Get keys in different formats
        private_key = vapid.private_key.private_bytes().hex()
        public_key = vapid.public_key.public_bytes().hex()
        
        # Display keys
        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('VAPID Keys Generated Successfully!'))
        self.stdout.write(self.style.SUCCESS('='*80 + '\n'))
        
        self.stdout.write(self.style.WARNING('Add these to your environment variables or settings.py:\n'))
        
        self.stdout.write('VAPID_PRIVATE_KEY:')
        self.stdout.write(self.style.HTTP_INFO(f'  {private_key}\n'))
        
        self.stdout.write('VAPID_PUBLIC_KEY:')
        self.stdout.write(self.style.HTTP_INFO(f'  {public_key}\n'))
        
        self.stdout.write(self.style.WARNING('Example .env file:'))
        self.stdout.write(f'VAPID_PRIVATE_KEY={private_key}')
        self.stdout.write(f'VAPID_PUBLIC_KEY={public_key}')
        self.stdout.write('VAPID_ADMIN_EMAIL=admin@xpump.com\n')
        
        self.stdout.write(self.style.SUCCESS('='*80))
        self.stdout.write(self.style.WARNING(
            '\nIMPORTANT: Keep the private key SECRET!'
        ))
        self.stdout.write(self.style.WARNING(
            'The public key should be shared with your frontend application.\n'
        ))
