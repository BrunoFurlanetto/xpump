"""
Management command to generate VAPID keys for Web Push notifications.

Usage:
    python manage.py generate_vapid_keys
"""
from django.core.management.base import BaseCommand
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend


class Command(BaseCommand):
    """Generate VAPID public and private keys for Web Push."""
    
    help = 'Generate VAPID keys for Web Push notifications'

    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write(self.style.WARNING(
            '\nGenerating VAPID keys for Web Push notifications...\n'
        ))
        
        # Generate private key using cryptography library
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        
        # Get private key in PEM format
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8').strip()
        
        # Get public key
        public_key = private_key.public_key()
        
        # Get public key in uncompressed format (required for VAPID)
        public_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        ).hex()
        
        # Display keys
        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('VAPID Keys Generated Successfully!'))
        self.stdout.write(self.style.SUCCESS('='*80 + '\n'))
        
        self.stdout.write(self.style.WARNING('Add these to your backend/core/local_settings.py:\n'))
        
        self.stdout.write('\nVAPID_PRIVATE_KEY = """')
        self.stdout.write(self.style.HTTP_INFO(private_pem))
        self.stdout.write('"""')
        
        self.stdout.write('\n\nVAPID_PUBLIC_KEY = ')
        self.stdout.write(self.style.HTTP_INFO(f"'{public_bytes}'"))
        
        self.stdout.write('\n\nVAPID_ADMIN_EMAIL = ')
        self.stdout.write("'admin@xpump.com'")
        
        self.stdout.write('\n\n' + self.style.WARNING('Copy the lines above to your local_settings.py file.'))
        
        self.stdout.write(self.style.SUCCESS('='*80))
        self.stdout.write(self.style.WARNING(
            '\nIMPORTANT: Keep the private key SECRET!'
        ))
        self.stdout.write(self.style.WARNING(
            'The public key should be shared with your frontend application.\n'
        ))
