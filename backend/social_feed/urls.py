from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet, CommentListCreateView, CommentDetailView, CommentToggleLikeView,
    ReportListCreateView, ReportDetailView, UserPostsView
)

app_name = 'social_feed'

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='posts')

urlpatterns = [
    path('', include(router.urls)),
    path('comments/', CommentListCreateView.as_view(), name='comment-list-create'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    path('comments/<int:pk>/toggle-like/', CommentToggleLikeView.as_view(), name='comment-toggle-like'),
    path('reports/', ReportListCreateView.as_view(), name='report-list-create'),
    path('reports/<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
    path('users/<int:user_id>/posts/', UserPostsView.as_view(), name='user-posts'),
]