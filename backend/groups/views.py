from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from groups.models import Group, GroupMembers
from groups.serializer import GroupSerializer, GroupMemberSerializer


@extend_schema(tags=['Groups'])
class GroupsAPIView(ListCreateAPIView):
    """
    API view for listing all groups and creating new groups.
    - GET: Returns list of all groups
    - POST: Creates new group with authenticated user as owner and admin
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

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
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

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


@extend_schema(tags=['Groups'])
class GroupMemberAPIView(RetrieveUpdateDestroyAPIView):
    """
    API view for individual group member operations.
    Handles member admin status updates and member removal with proper permissions.
    """
    serializer_class = GroupMemberSerializer
    permission_classes = [IsAuthenticated]
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
class JoinGroupAPIView(APIView):
    """
    API view for joining groups using invite codes.
    Allows users to join groups by providing the group's unique invite code.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Join a group using an invite code.
        Creates membership record and adds group to user's profile.
        """
        try:
            # Find group by invite code
            group = Group.objects.get(invite_code=kwargs['invite_code'])
        except Group.DoesNotExist:
            return Response({"detail": "Group does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user is already a member
        if GroupMembers.objects.filter(group_id=group.id, member_id=request.user.id).exists():
            return Response({"detail": "User already joined this group"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create membership record
            GroupMembers.objects.create(group_id=group.id, member_id=request.user.id)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Add group to user's profile
        request.user.profile.groups.add(group)

        return Response({"detail": "User joined this group"}, status=status.HTTP_200_OK)
