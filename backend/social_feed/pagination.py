from rest_framework.pagination import PageNumberPagination


class PostsPagination(PageNumberPagination):
    """
    Paginação padrão do DRF para posts.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class CommentsPagination(PageNumberPagination):
    """
    Paginação padrão do DRF para comentários.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50
