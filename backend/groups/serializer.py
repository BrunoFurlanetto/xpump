from django.contrib.auth.models import User
from django.db.models import FloatField, Sum, Value, Window, F, Count, OuterRef, Subquery, IntegerField
from django.db.models.functions import Coalesce, Rank
from rest_framework import serializers
from urllib3 import request

from groups.models import Group, GroupMembers
from groups.services import create_group_for_client, compute_group_members_data
from nutrition.models import Meal
from workouts.models import WorkoutCheckin


class GroupCreateFromMainSerializer(serializers.ModelSerializer):
    """
    Serializer to create a new group from a main group.
    The new group will be associated with the same client as the main group.
    """

    members_list = serializers.ListField(write_only=True, required=False)

    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'photo',
            'description',
            'created_by',
            'owner',
            'created_at',
            'members_list',
            'main',
        ]  # Include all model fields in serialization
        read_only_fields = ['created_by', 'created_at', 'main']  # Prevent modification of read-only fields

    def validate(self, attrs):
        """
        Validate that required fields are provided and not empty.
        1. 'name' must be provided and not empty.
        2. 'members_list' (if provided) must contain valid user IDs or usernames.
        """
        # Validate that the group name is provided and not empty.
        name = attrs.get('name', '')

        if not isinstance(name, str) or not name.strip():
            raise serializers.ValidationError({'name': 'A group name is required.'})

        attrs['name'] = name.strip()

        # Validate members_list if provided
        members_list = attrs.get('members_list', [])

        if members_list:
            if isinstance(members_list[0], int):
                members = User.objects.filter(id__in=members_list)
                found_ids = {member.id for member in members}
                missing = [i for i in members_list if i not in found_ids]

                if missing:
                    raise serializers.ValidationError(f"Users with IDs {missing} do not exist.")
            elif isinstance(members_list[0], str):
                members = User.objects.filter(username__in=members_list)
                found_ids = {member.username for member in members}
                missing = [u for u in members_list if u not in found_ids]

                if missing:
                    raise serializers.ValidationError(f"Users with usernames {missing} do not exist.")
            else:
                raise serializers.ValidationError("members_list must be a list of IDs or a list of usernames.")

        return attrs

    def create(self, validated_data):
        """
        Create a new group instance from the validated data.
        Sets 'main' to False and assigns the owner to the creator.
        """
        add_creator = validated_data.pop('add_creator', True)
        client = validated_data.pop('client', None)
        members_list = validated_data.pop('members_list', [])
        created_by = self.context['request'].user
        members = []

        if not client:
            raise serializers.ValidationError({'client': 'A client is required.'})

        if members_list:
            if isinstance(members_list[0], int):
                members = User.objects.filter(id__in=members_list)
            elif isinstance(members_list[0], str):
                members = User.objects.filter(username__in=members_list)

            members = list(members)

        group = create_group_for_client(
            client=client,
            name=validated_data.get('name'),
            photo=validated_data.get('photo', None),
            description=validated_data.get('description', None),
            owner=client.owners,
            created_by=created_by,
            members_list=members,
            add_creator=add_creator,
        )

        return group


class GroupListSerializer(serializers.ModelSerializer):
    """
    Serializer for Group model.
    Handles serialization/deserialization of group data for API endpoints.
    """

    members_count = serializers.SerializerMethodField()
    created_by = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'photo',
            'description',
            'created_by',
            'owner',
            'created_at',
            'members_count',
            'main',
        ]  # Include all model fields in serialization
        read_only_fields = ['photo', 'created_by', 'created_at', 'members_count', 'main']  # Prevent modification of read-only fields

    def get_members_count(self, obj):
        """
        Return the count of active (non-pending) members in the group.
        """
        return obj.groupmembers_set.filter(pending=False).count()

    def create(self, validated_data):
        """
        Create a new group instance from the validated data.
        """
        # group = Group.objects.create(**validated_data)
        owner = validated_data.get('owner', None)

        group = create_group_for_client(
            client=owner.profile.employer,
            name=validated_data.get('name'),
            description=validated_data.get('description', ''),
            owner=owner,
            photo=validated_data.get('photo', None),
            created_by=owner,
        )

        return group


class GroupAdminListSerializer(GroupListSerializer):
    """
    Serializer for Group model.
    Handles serialization/deserialization of group data for API endpoints.
    """
    pass


class GroupDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Group model.
    Handles serialization/deserialization of group data for API endpoints.
    """

    members = serializers.SerializerMethodField()
    # pending_members = serializers.SerializerMethodField()
    other_groups = serializers.SerializerMethodField(read_only=True)
    created_by = serializers.CharField(source='created_by.get_full_name', read_only=True)
    stats = serializers.SerializerMethodField(read_only=True)
    client_code = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Group
        fields = [
            'id',
            'client_code',
            'name',
            'photo',
            'description',
            'created_by',
            'owner',
            'created_at',
            'members',
            'stats',
            'other_groups',
            'main',
        ]  # Include all model fields in serialization
        read_only_fields = ['created_by', 'created_at', 'members', 'other_groups', 'main', 'client_code']  # Prevent modification of read-only fields

    def get_client_code(self, obj):
        """
        Return the client code associated with the group's owner.
        """
        if obj.owner == self.context['request'].user or self.context['request'].user.is_superuser:
            return obj.owner.profile.employer.client_code

        return None

    def _get_group_data(self, obj):
        """
        Cache and return the result of compute_group_members_data for this group.
        """
        if not hasattr(self, '_group_data_cache'):
            self._group_data_cache = {}
        if obj.pk not in self._group_data_cache:            
            self._group_data_cache[obj.pk] = compute_group_members_data(obj)
        return self._group_data_cache[obj.pk]

    def get_members(self, obj):
        """
        Return the list of active members with monthly scores,
        computed by the service layer.
        """
        return self._get_group_data(obj)['members']

    def get_pending_members(self, obj):
        """
        Retrieve and serialize the pending members of the group.
        Uses GroupMemberSerializer to represent each pending member.
        """
        pending_members = obj.groupmembers_set.select_related('member', 'member__profile').filter(pending=True)

        return [{
                "id": member.member.id,
                "username": member.member.username,
                "email": member.member.email,
                "profile_id": getattr(getattr(member.member, 'profile', None), 'id', None),
                "joined_at": member.joined_at,
            }
            for member in pending_members
        ]

    def get_stats(self, obj):
        """
        Return group statistics computed by the service layer (current month).
        """
        return self._get_group_data(obj)['stats']

    def get_other_groups(self, obj):
        """
        Retrieve and serialize other groups associated with the same members as the current group.
        Excludes the current group from the list.
        """
        from groups.services import compute_another_groups

        if obj.owner == self.context['request'].user or self.context['request'].user.is_superuser:
            if obj.main:
                return compute_another_groups(obj)

        return None


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
        Validate that no read-only fields are provided in the input data.
        Uses Meta.read_only_fields to avoid duplicating the list of protected fields.
        """
        errors = {}
        read_only = getattr(self.Meta, 'read_only_fields', ())

        for field in read_only:
            if field in (self.initial_data or {}):
                errors[field] = "This field is read-only and cannot be modified."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
