from django.db.models import Window, F
from django.db.models.functions import Rank
from rest_framework import serializers

from groups.models import Group, GroupMembers


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer for Group model.
    Handles serialization/deserialization of group data for API endpoints.
    """

    members = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'description',
            'created_by',
            'owner',
            'created_at',
            'members',
            'main',
        ]  # Include all model fields in serialization
        read_only_fields = ['created_by', 'created_at', 'members', 'main']  # Prevent modification of read-only fields

    def get_members(self, obj):
        """
        Retrieve and serialize the members of the group.
        Uses GroupMemberSerializer to represent each member.
        """
        members = obj.groupmembers_set.select_related('member', 'member__profile').annotate(
            score=F('member__profile__score'),
            position=Window(
                expression=Rank(),
                order_by=F('member__profile__score').desc(),
            )
        ).order_by('position')

        return [{
                "id": member.member.id,
                "username": member.member.username,
                "email": member.member.email,
                "is_admin": member.is_admin,
                "joined_at": member.joined_at,
                "pending": member.pending,
                "position": int(member.position) if not member.pending else None,
                "score": member.score if not member.pending else None,
            }
            for member in members
        ]


class GroupMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for GroupMembers model.
    Controls which fields can be modified and validates member data.
    Only allows updating admin status, while member and join date are read-only.
    """
    class Meta:
        model = GroupMembers
        fields = ['member', 'joined_at', 'is_admin', 'pending']
        read_only_fields = ['member', 'joined_at', 'pending']  # Prevent modification of member and join date

    def validate(self, attrs):
        """
        Custom validation to ensure read-only fields are not provided in requests.
        Prevents clients from attempting to modify protected fields.
        """
        if 'joined_at' in self.initial_data:
            raise serializers.ValidationError({
                "joined_at": "This field is read-only and cannot be modified."
            })

        if 'pending' in self.initial_data:
            raise serializers.ValidationError({
                "pending": "This field is read-only and cannot be modified."
            })

        return attrs
