from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from clients.models import Client
from groups.models import GroupMembers
from profiles.models import Profile


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simplified user serializer for posts and comments"""
    username = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()
    score = serializers.FloatField(source='profile.score', read_only=True)
    level = serializers.IntegerField(source='profile.level', read_only=True)

    class Meta:
        model = User
        fields = ['username', 'full_name', 'score', 'level']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with password confirmation and profile integration.
    Handles user registration with validation for passwords, email uniqueness, and required fields.
    """
    # Write-only password fields for security
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)  # Password confirmation field
    profile_id = serializers.SerializerMethodField()  # Read-only field to get associated profile ID
    client_code = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # Standard fields (avoids exposing password and other sensitive data)
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'profile_id', 'client_code']
        extra_kwargs = {
            'email': {'required': True},  # Make email field required
        }

    def get_profile_id(self, obj):
        """
        Get the profile ID associated with the user.
        Returns None if no profile exists for the user.
        """
        profile = getattr(obj, 'profile', None)

        return getattr(profile, 'id', None) if profile else None

    def validate(self, attrs):
        """
        Validate user data including password confirmation, email uniqueness, and required fields.
        """
        # Check if passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})

        # Check if email is already registered
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'Email already registered'})

        # Validate that first name is not empty
        if attrs['first_name'] == '':
            raise serializers.ValidationError({'first_name': 'First Name required'})

        if attrs['client_code'] == '':
            raise serializers.ValidationError({'client_code': 'Client Code required'})

        return attrs

    def create(self, validated_data):
        """
        Create a new user instance with validated data.
        Removes password confirmation field before creating the user.
        """
        client_code = validated_data.pop('client_code', None)

        try:
            employer = Client.objects.get(client_code=client_code)
        except Client.DoesNotExist:
            raise serializers.ValidationError({'client_code': 'Invalid client code'})

        # Remove password confirmation field as it's not needed for user creation
        validated_data.pop('password2', None)
        # Create user with hashed password
        user = User.objects.create_user(**validated_data)
        profile = Profile.objects.create(user=user, employer=employer)
        profile.groups.add(employer.main_group)
        GroupMembers.objects.create(member=user, group=employer.main_group, pending=False)

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Customiza o token JWT para incluir grupos de permissão do usuário.
    Adiciona user_permission_groups ao payload do access token.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Adiciona grupos de permissão ao payload do token
        token['role'] = list(user.groups.values_list('name', flat=True))

        return token


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Customiza o refresh token para incluir grupos de permissão do usuário no novo access token.
    Busca os grupos atualizados do banco de dados ao gerar novo access token.
    """
    def validate(self, attrs):
        data = super().validate(attrs)

        # Obtém o refresh token e o usuário associado
        refresh = RefreshToken(attrs['refresh'])
        user_id = refresh.get('user_id')

        # Busca o usuário e adiciona grupos ao novo access token
        try:
            user = User.objects.get(id=user_id)
            # Adiciona grupos de permissão atualizados à resposta
            data['role'] = list(user.groups.values_list('name', flat=True))
        except User.DoesNotExist:
            pass

        return data
