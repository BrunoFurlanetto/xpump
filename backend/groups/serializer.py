from rest_framework import serializers

from groups.models import Group, GroupMembers


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer for Group model.
    Handles serialization/deserialization of group data for API endpoints.
    """
    class Meta:
        model = Group
        fields = '__all__'  # Include all model fields in serialization


class GroupMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for GroupMembers model.
    Controls which fields can be modified and validates member data.
    Only allows updating admin status, while member and join date are read-only.
    """
    class Meta:
        model = GroupMembers
        fields = ['member', 'joined_at', 'is_admin']
        read_only_fields = ['member', 'joined_at']  # Prevent modification of member and join date

    def validate(self, attrs):
        """
        Custom validation to ensure read-only fields are not provided in requests.
        Prevents clients from attempting to modify protected fields.
        """
        if 'joined_at' in self.initial_data:
            raise serializers.ValidationError({
                "joined_at": "This field is read-only and cannot be modified."
            })

        return attrs
