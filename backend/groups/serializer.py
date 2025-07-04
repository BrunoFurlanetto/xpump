from rest_framework import serializers

from groups.models import Group, GroupMembers


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    members = serializers.HyperlinkedRelatedField(many=True, read_only=True, view_name='group-members')

    class Meta:
        model = Group
        fields = [
            'name',
            'description',
            'invite_code',
            'created_at',
            'created_by',
            'owner',
            'members'
        ]


class GroupMemberSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        models = GroupMembers
        fields = '__all__'
