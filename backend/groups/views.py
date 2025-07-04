from django.shortcuts import render
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from groups.models import Group, GroupMembers
from groups.serializer import GroupSerializer, GroupMemberSerializer


@extend_schema(tags=['Groups'])
class GroupsAPIView(ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Groups'])
class GroupAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()

        if request.user != group.owner:
            raise PermissionDenied("Only the group owner can delete it")

        return super().destroy(request, *args, **kwargs)


@extend_schema(tags=['Groups'])
class GroupMembersAPIView(ListAPIView):
    serializer_class = GroupMemberSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']

    def get_queryset(self):
        return GroupMembers.objects.filter(group_id=self.kwargs['group_id'])


@extend_schema(tags=['Groups'])
class GroupMemberAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = GroupMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GroupMembers.objects.filter(group_id=self.kwargs['group_id'], member_id=self.kwargs['user_id'])

    def update(self, request, *args, **kwargs):
        group = Group.objects.get(pk=self.kwargs['group_id'])

        if group.owner != request.user:
            if request.POST.get('is_admin', None):
                return PermissionDenied("Only the group owner can update admin members")
            else:
                return Response(
                    {
                        "detail": "Only is_admin field can be updated from group owner"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

    def delete(self, request, *args, **kwargs):
        member = GroupMembers.objects.filter(member_id=request.user.id)
        member_removed = self.get_object()

        if member.exists():
            if not member.is_admin:
                return PermissionDenied("Only admin group can delete another members")

            if member_removed.is_admin:
                return PermissionDenied("Only group owner can delete admin members")
        else:
            return Response({"detail": "User not a member of this groups"}, status=status.HTTP_400_BAD_REQUEST)
