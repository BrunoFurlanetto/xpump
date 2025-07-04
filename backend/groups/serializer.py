from rest_framework import serializers

from groups.models import Group, GroupMembers


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = [
            'name',
            'description',
            'invite_code',
            'created_at',
            'created_by',
            'owner',
        ]


class GroupMemberSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = GroupMembers
        fields = '__all__'
