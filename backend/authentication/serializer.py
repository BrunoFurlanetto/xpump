from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        # Campos padrão (evita expor senha e outros dados sensíveis)
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'profile_id']
        extra_kwargs = {
            'email': {'required': True},
        }

    def get_profile_id(self, obj):
        profile = getattr(obj, 'profile', None)

        return getattr(profile, 'id', None) if profile else None

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})

        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'Email already registered'})

        if attrs['first_name'] == '':
            raise serializers.ValidationError({'first_name': 'First Name required'})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        user = User.objects.create_user(**validated_data)

        return user
