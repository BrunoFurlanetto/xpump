from rest_framework import serializers

from groups.models import Group, GroupMembers


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'


class GroupMemberSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        models = GroupMembers
        fields = '__all__'
