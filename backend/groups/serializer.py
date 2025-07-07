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
