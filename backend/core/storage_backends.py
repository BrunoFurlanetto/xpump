"""
Custom storage backends para Cloudflare R2
"""
from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings


class CloudflareR2Storage(S3Boto3Storage):
    """
    Storage customizado para Cloudflare R2 com suporte a URLs assinadas
    """
    # Cloudflare R2 não suporta ACLs
    default_acl = None

    # URL protocol
    url_protocol = 'https:'

    # Usar path-style addressing
    addressing_style = 'path'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Garantir que as configurações corretas sejam aplicadas
        self.default_acl = None

        # Configurar querystring auth baseado nas settings
        if hasattr(settings, 'AWS_QUERYSTRING_AUTH'):
            self.querystring_auth = settings.AWS_QUERYSTRING_AUTH

        if hasattr(settings, 'AWS_QUERYSTRING_EXPIRE'):
            self.querystring_expire = settings.AWS_QUERYSTRING_EXPIRE

    def url(self, name, parameters=None, expire=None, http_method=None):
        """
        Gera URL para o arquivo.
        Se AWS_S3_CUSTOM_DOMAIN estiver configurado, usa URL pública.
        Caso contrário, gera URL assinada temporária.
        """
        # Se tiver domínio customizado, usa URL pública
        if hasattr(settings, 'AWS_S3_CUSTOM_DOMAIN') and settings.AWS_S3_CUSTOM_DOMAIN:
            return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{name}"

        # Caso contrário, gera URL assinada
        return super().url(name, parameters=parameters, expire=expire, http_method=http_method)

