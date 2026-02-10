"""
Pagination classes for notifications app.
"""
from rest_framework.pagination import PageNumberPagination


class NotificationPagination(PageNumberPagination):
    """
    Pagination for notifications list.
    
    Returns 20 notifications per page by default, max 100.
    """
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
