from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirmar senha')

    class Meta:
        model = User
        # inclua first_name e last_name aqui
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, data):
        # Confirmação de senha
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError("As senhas não conferem.")
        # Nomes não podem estar em branco
        if not data.get('first_name').strip():
            raise serializers.ValidationError({"first_name": "Este campo é obrigatório."})
        if not data.get('last_name').strip():
            raise serializers.ValidationError({"last_name": "Este campo é obrigatório."})
        return data

    def create(self, validated_data):
        # Extrai os campos de nome
        first = validated_data.pop('first_name')
        last = validated_data.pop('last_name')
        pwd = validated_data.pop('password')

        # Cria o User com first_name e last_name
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=pwd,
            first_name=first,
            last_name=last,
        )

        # Cria o profile vazio (todos os defaults)
        Profile.objects.create(user=user)
        return user
