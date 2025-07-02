from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Campos padrão (evita expor senha e outros dados sensíveis)
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'date_joined']
