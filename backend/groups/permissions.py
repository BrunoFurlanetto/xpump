from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission
from groups.models import GroupMembers, Group


class IsMember(BasePermission):
    message = 'User not a member of the group or membership is pending.'

    def _get_group_id(self, request, view):
        return view.kwargs.get('group_id') or request.data.get('group_id')

    def has_permission(self, request, view):
        group_id = self._get_group_id(request, view)

        if not group_id:
            return False

        if not Group.objects.filter(pk=group_id).exists():
            raise NotFound("Group does not exist.")

        if not group_id:
            return False
        try:
            membership = GroupMembers.objects.get(group_id=group_id, member_id=request.user.id)
        except GroupMembers.DoesNotExist:
            return False

        return membership.pending is False

    def has_object_permission(self, request, view, obj):
        group_id = self._get_group_id(request, view)

        if not group_id:
            return False
        try:
            membership = GroupMembers.objects.get(group_id=group_id, member_id=request.user.id)
        except GroupMembers.DoesNotExist:
            return False

        return membership.pending is False


class IsAdminMember(BasePermission):
    message = "User is not an admin member of the group."

    def _get_group_id(self, request, view):
        return view.kwargs.get('group_id') or request.data.get('group_id')

    def has_permission(self, request, view):
        group_id = self._get_group_id(request, view)

        if not group_id:
            return False
        try:
            membership = GroupMembers.objects.get(group_id=group_id, member_id=request.user.id)
        except GroupMembers.DoesNotExist:
            return False

        return membership.is_admin

    def has_object_permission(self, request, view, obj):
        group_id = self._get_group_id(request, view)

        if not group_id:
            return False
        try:
            membership = GroupMembers.objects.get(group_id=group_id, member_id=request.user.id)
        except GroupMembers.DoesNotExist:
            return False

        return membership.is_admin and membership.pending is False
