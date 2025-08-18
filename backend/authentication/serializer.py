from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with password confirmation and profile integration.
    Handles user registration with validation for passwords, email uniqueness, and required fields.
    """
    # Write-only password fields for security
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)  # Password confirmation field
    profile_id = serializers.SerializerMethodField()  # Read-only field to get associated profile ID

    class Meta:
        model = User
        # Standard fields (avoids exposing password and other sensitive data)
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'profile_id']
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

        return attrs

    def create(self, validated_data):
        """
        Create a new user instance with validated data.
        Removes password confirmation field before creating the user.
        """
        # Remove password confirmation field as it's not needed for user creation
        validated_data.pop('password2', None)
        # Create user with hashed password
        user = User.objects.create_user(**validated_data)

        return user
