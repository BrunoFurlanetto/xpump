# clients/models.py
import uuid

from django.contrib.auth.models import User
from django.core.validators import EmailValidator
from django.db import models
from django.conf import settings
from django.utils import timezone

from groups.models import Group


class Client(models.Model):
    name = models.CharField(max_length=255, verbose_name='Nome fantasia')
    cnpj = models.CharField(max_length=20, unique=True, verbose_name="CNPJ")
    contact_email = models.EmailField(validators=[EmailValidator()], verbose_name='E-mail')
    phone = models.CharField(max_length=14, verbose_name="Telefone")
    address = models.TextField(verbose_name='Endereço')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(editable=False, default=timezone.now, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    updated_by = models.ForeignKey(
        User,
        limit_choices_to={'is_staff': True},
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_clients',
        verbose_name='Atualizado por'
    )
    owners = models.ForeignKey(User, on_delete=models.PROTECT, related_name='clients', verbose_name='Proprietário')
    groups = models.ManyToManyField(Group, blank=True, related_name='clients', verbose_name='Grupos')
    client_code = models.UUIDField(default=uuid.uuid4, editable=False, verbose_name='Código do Cliente')

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return self.name
