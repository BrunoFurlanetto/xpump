from rest_framework import serializers

from groups.models import Group, GroupMembers


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'


class GroupMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMembers
        fields = ['member', 'joined_at', 'is_admin']
        read_only_fields = ['member', 'joined_at']

    def validate(self, data):
        """
        Custom validation to check that read-only fields are not provided.
        """
        if 'joined_at' in data:
            raise serializers.ValidationError({"joined_at": "This field is read-only and cannot be modified."})

        return data
