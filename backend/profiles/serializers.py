# profiles/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        # liste aqui apenas os campos que o usuário poderá enviar no registro
        fields = ('height', 'weight', 'photo', 'notification_preferences')


class RegisterSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirmar senha')
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = (
            'username', 'email',
            'first_name', 'last_name',
            'password', 'password2',
            'profile'
        )

    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError("As senhas não conferem.")
        return data

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            first_name=first_name,
            last_name=last_name,
            password=validated_data['password']
        )
        Profile.objects.create(user=user, **profile_data)
        return user
