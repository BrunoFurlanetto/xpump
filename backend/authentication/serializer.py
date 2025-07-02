from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # Campos padrão (evita expor senha e outros dados sensíveis)
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError('Passwords do not match')

        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError('Email already registered')

        if attrs['first_name'] == '':
            raise serializers.ValidationError('First Name required')

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)

        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user
