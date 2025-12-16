from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from groups.models import Group, GroupMembers
from groups.permissions import IsMember, IsAdminMember, IsGroupMember
from groups.serializer import GroupMemberSerializer, GroupListSerializer, GroupDetailSerializer
from groups.services import compute_group_members_data, compute_another_groups


@extend_schema(tags=['Groups'])
class GroupsAPIView(ListCreateAPIView):
    """
    API view for listing all groups and creating new groups.
    - GET: Returns list of all groups
    - POST: Creates new group with authenticated user as owner and admin
    """
    queryset = Group.objects.all()
    serializer_class = GroupListSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminUser()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """
        Create a new group with the authenticated user as both creator and owner.
        Automatically grants admin privileges to the creator.
        """
        serializer.save(created_by=self.request.user, owner=self.request.user)


@extend_schema(tags=['Groups'])
class GroupAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual group operations (retrieve, update, delete).
    Only group owners can delete groups.
    """
    queryset = Group.objects.all()
    serializer_class = GroupDetailSerializer
    permission_classes = [IsAuthenticated, IsGroupMember]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['detail'] = getattr(self, 'action', None) == 'retrieve'

        return ctx

    def destroy(self, request, *args, **kwargs):
        """
        Delete a group. Only the group owner has permission to delete.
        Ensures proper authorization before deletion.
        """
        group = self.get_object()

        # Check if current user is the group owner
        if request.user != group.owner:
            raise PermissionDenied("Only the group owner can delete it")

        return super().destroy(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """
        Suporta query param `period` = 'all' (padrão), 'week' ou 'month'.
        - 'all': comportamento padrão do serializer.
        - 'week' / 'month': delega cálculo de ranking para compute_group_members_data.
        """
        group = self.get_object()
        period = request.GET.get('period', 'all').lower()

        if period == 'all':
            serializer = self.get_serializer(group)

            return Response(serializer.data, status=status.HTTP_200_OK)

        try:
            group_data = compute_group_members_data(group, period)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        base = self.get_serializer(group).data
        base['members'] = group_data.get('members', [])
        return Response(base, status=status.HTTP_200_OK)

# @extend_schema(tags=['Groups'])
# class GroupStatsAPIView(APIView):


@extend_schema(tags=['Groups'])
class GroupMeAPIView(APIView):
    """
    API view for retrieving groups the authenticated user is a member of.
    Returns groups associated with the user's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        members = GroupMembers.objects.filter(member=self.request.user)
        groups = Group.objects.filter(groupmembers__in=members).distinct()
        serializer = GroupListSerializer(groups, many=True, context={'request': request})

        data = serializer.data
        pending_map = {gm.group_id: gm.pending for gm in members}

        for item in data:
            gid = item.get('id') or item.get('pk')
            item['pending'] = pending_map.get(gid, False)

        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Groups'])
class GroupMemberAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual group member operations.
    Handles member admin status updates and member removal with proper permissions.
    """
    serializer_class = GroupMemberSerializer
    permission_classes = [IsAuthenticated, IsMember]
    lookup_field = 'member_id'

    def get_queryset(self):
        """
        Return specific member in a specific group.
        Filters by both group ID and member ID from URL parameters.
        """
        return GroupMembers.objects.filter(group_id=self.kwargs['group_id'], member_id=self.kwargs['member_id'])

    def update(self, request, *args, **kwargs):
        """
        Update group member information.
        Only allows updating admin status and only by group owner.
        """
        group = Group.objects.get(pk=self.kwargs['group_id'])
        group_member = self.get_object()

        # Ensure only admin status can be updated
        if set(request.data.keys()) - {'is_admin'}:
            return Response(
                {"error": "Only is_admin field can be updated from group owner"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if current user is the group owner
        if group.owner != request.user:
            raise PermissionDenied("Only the group owner can update admin members")

        return super().update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        """
        Remove a member from the group.
        Implements permission hierarchy: admins can remove regular members,
        only owner can remove admin members.
        """
        # Get current user's membership status
        member = GroupMembers.objects.filter(member_id=request.user.id).first()
        group = Group.objects.get(pk=self.kwargs['group_id'])
        member_removed = self.get_object()

        if member:
            # Check if user has admin privileges
            if not member.is_admin:
                raise PermissionDenied("Only admin group can delete another members")

            # Only group owner can remove admin members
            if member_removed.is_admin and member.member != group.owner:
                raise PermissionDenied("Only group owner can delete admin members")
        else:
            return Response({"detail": "User not a member of this groups"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Remove group from member's profile
            member_removed.member.profile.groups.remove(group)
        except ObjectDoesNotExist:
            pass  # Profile doesn't exist, continue with member removal
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return super().delete(request, *args, **kwargs)


@extend_schema(tags=['Groups'])
class InviteGroupAPIView(APIView):
    """
    API view for joining groups using invite codes.
    Allows users to join groups by providing the group's unique invite code.
    """
    permission_classes = [IsAuthenticated, IsAdminMember]

    def post(self, request, *args, **kwargs):
        try:
            invited_user = User.objects.get(username=self.kwargs['user'])
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        group = Group.objects.get(id=self.kwargs['group_id'])
        member_exists = GroupMembers.objects.filter(member=invited_user, group=group)

        if member_exists.exists() and member_exists.first().pending:
            return Response({"detail": "User already invited to this group"}, status=status.HTTP_400_BAD_REQUEST)

        if member_exists.exists():
            return Response({"detail": "User already a member of this group"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            GroupMembers.objects.create(member=invited_user, group=group)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": f"User {invited_user.username} invited to group {group.name}."},
                        status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Groups'],
    request={
        'application/json': {
            'type': 'object', 'properties': {
                'action': {
                    'type': 'string', 'enum': ['accept', 'reject']}
            },
            'required': ['action']
        }
    }
)
class InviteGroupAccept(APIView):
    """
    API view for accepting or rejecting group invitations.
    Allows invited users to respond to group membership invitations.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        action = request.data.get('action')

        if action not in ['accept', 'reject']:
            return Response({"detail": "Invalid action. Use 'accept' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group_member = GroupMembers.objects.get(member=request.user, group_id=self.kwargs['group_id'], pending=True)
        except GroupMembers.DoesNotExist:
            return Response({"detail": "No pending invitation found for this group."}, status=status.HTTP_404_NOT_FOUND)

        if action == 'accept':
            group_member.pending = False
            group_member.save()
            # Add group to user's profile groups
            try:
                request.user.profile.groups.add(group_member.group)
            except ObjectDoesNotExist:
                pass

            return Response({"detail": "You have successfully joined the group."}, status=status.HTTP_200_OK)
        else:
            group_member.delete()

            return Response({"detail": "You have rejected the group invitation."}, status=status.HTTP_200_OK)


@extend_schema(tags=['Groups'])
class QuitingGroupAPIView(APIView):
    """
    API view for quitting a group.
    Allows members to leave a group they are part of.
    """
    permission_classes = [IsAuthenticated, IsMember]

    def post(self, request, *args, **kwargs):
        try:
            group = Group.objects.get(id=self.kwargs['group_id'])
        except Group.DoesNotExist:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        if group.main:
            return Response({
                "detail": "Cannot quit for this group. This is the enterprise group. Only manager can remove you."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            group_member = GroupMembers.objects.get(
                member=request.user,
                group_id=group.id,
                pending=False
            )
        except GroupMembers.DoesNotExist:
            return Response({"detail": "You are not a member of this group."}, status=status.HTTP_404_NOT_FOUND)

        if group_member.group.owner == request.user:
            return Response({"detail": "Group owner cannot quit the group. Transfer ownership or delete the group."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # Remove group from user's profile groups
            request.user.profile.groups.remove(group_member.group)
        except ObjectDoesNotExist:
            pass

        group_member.delete()

        return Response({"detail": "You have successfully quit the group."}, status=status.HTTP_200_OK)
