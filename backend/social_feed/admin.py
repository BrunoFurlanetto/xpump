from django.contrib import admin
from django.contrib import messages
from django.utils.safestring import mark_safe

from .models import Post, ContentFilePost, Comment, PostLike, CommentLike


class ContentFilePostInline(admin.TabularInline):
    model = ContentFilePost
    extra = 0
    readonly_fields = ('uploaded_at', 'preview_file')
    fields = ('file', 'preview_file', 'uploaded_at')

    def preview_file(self, obj):
        if obj.file:
            if obj.file.name.endswith(('.jpg', '.jpeg', '.png')):
                return mark_safe(f'<img src="{obj.file.url}" style="max-height: 100px; max-width: 150px;" />')
            else:
                return mark_safe(f'<a href="{obj.file.url}" target="_blank">Ver arquivo</a>')
        return '-'
    preview_file.short_description = 'Preview'


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'content_type', 'visibility', 'created_at', 'likes_count', 'comments_count', 'status', 'allow_comments')
    list_filter = ('content_type', 'visibility', 'status', 'allow_comments', 'created_at')
    search_fields = ('user__username', 'user__email', 'content_text')
    readonly_fields = ('created_at', 'likes_count', 'comments_count', 'user')
    date_hierarchy = 'created_at'
    inlines = [ContentFilePostInline]

    fieldsets = (
        ('Informações do Post', {
            'fields': ('user', 'content_type', 'content_text', 'created_at')
        }),
        ('Configurações', {
            'fields': ('visibility', 'allow_comments', 'status')
        }),
        ('Conteúdo Relacionado', {
            'fields': ('workout_checkin', 'meal'),
            'classes': ('collapse',)
        }),
        ('Estatísticas (Somente Leitura)', {
            'fields': ('likes_count', 'comments_count'),
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_posts', 'block_posts']

    def approve_posts(self, request, queryset):
        """Marca posts como aprovados"""
        from status.models import Status
        try:
            approved_status = Status.objects.get(app_name='POST', action='APPROVED', is_active=True)
            updated = queryset.update(status=approved_status)
            self.message_user(
                request,
                f'{updated} post(s) aprovado(s) com sucesso.',
                messages.SUCCESS
            )
        except Status.DoesNotExist:
            self.message_user(
                request,
                'Status "Aprovado" não encontrado. Crie-o primeiro.',
                messages.ERROR
            )
    approve_posts.short_description = 'Aprovar posts selecionados'

    def block_posts(self, request, queryset):
        """Marca posts como bloqueados"""
        from status.models import Status
        try:
            blocked_status = Status.objects.get(app_name='POST', action='BLOCKED', is_active=True)
            updated = queryset.update(status=blocked_status)
            self.message_user(
                request,
                f'{updated} post(s) bloqueado(s) com sucesso.',
                messages.WARNING
            )
        except Status.DoesNotExist:
            self.message_user(
                request,
                'Status "Bloqueado" não encontrado. Crie-o primeiro.',
                messages.ERROR
            )
    block_posts.short_description = 'Bloquear posts selecionados'

    def save_model(self, request, obj, form, change):
        """Validação ao salvar"""
        if change and 'user' in form.changed_data:
            self.message_user(
                request,
                'ATENÇÃO: Alterar o usuário de um post não é recomendado.',
                messages.WARNING
            )

        super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        """Aviso ao deletar post com muitos dados relacionados"""
        comments_count = obj.comments.count()
        likes_count = obj.likes.count()
        files_count = obj.content_files.count()

        if comments_count > 10 or likes_count > 10:
            self.message_user(
                request,
                f'ATENÇÃO: Este post possui {comments_count} comentário(s) e {likes_count} curtida(s) '
                f'que serão deletados em cascata.',
                messages.WARNING
            )

        super().delete_model(request, obj)
        self.message_user(
            request,
            f'Post deletado com sucesso. {comments_count} comentário(s), {likes_count} curtida(s) '
            f'e {files_count} arquivo(s) também foram removidos.',
            messages.SUCCESS
        )


@admin.register(ContentFilePost)
class ContentFilePostAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'get_user', 'uploaded_at', 'preview_file')
    list_filter = ('uploaded_at',)
    search_fields = ('post__user__username',)
    readonly_fields = ('uploaded_at', 'preview_file')

    def get_user(self, obj):
        return obj.post.user.username
    get_user.short_description = 'Usuário'
    get_user.admin_order_field = 'post__user__username'

    def preview_file(self, obj):
        if obj.file:
            if obj.file.name.endswith(('.jpg', '.jpeg', '.png')):
                return mark_safe(f'<img src="{obj.file.url}" style="max-height: 150px; max-width: 200px;" />')
            else:
                return mark_safe(f'<a href="{obj.file.url}" target="_blank">Ver arquivo ({obj.file.name.split(".")[-1].upper()})</a>')
        return '-'
    preview_file.short_description = 'Preview'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'text_truncated', 'likes_count', 'created_at', 'status')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'text', 'post__id')
    readonly_fields = ('created_at', 'likes_count')
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Informações do Comentário', {
            'fields': ('post', 'user', 'text', 'created_at')
        }),
        ('Status e Estatísticas', {
            'fields': ('status', 'likes_count')
        }),
    )

    def text_truncated(self, obj):
        max_length = 50
        if len(obj.text) > max_length:
            return f'{obj.text[:max_length]}...'
        return obj.text
    text_truncated.short_description = 'Texto'

    actions = ['approve_comments', 'block_comments']

    def approve_comments(self, request, queryset):
        """Marca comentários como aprovados"""
        from status.models import Status
        try:
            approved_status = Status.objects.get(app_name='COMMENT', action='APPROVED', is_active=True)
            updated = queryset.update(status=approved_status)
            self.message_user(
                request,
                f'{updated} comentário(s) aprovado(s) com sucesso.',
                messages.SUCCESS
            )
        except Status.DoesNotExist:
            self.message_user(
                request,
                'Status "Aprovado" não encontrado. Crie-o primeiro.',
                messages.ERROR
            )
    approve_comments.short_description = 'Aprovar comentários selecionados'

    def block_comments(self, request, queryset):
        """Marca comentários como bloqueados"""
        from status.models import Status
        try:
            blocked_status = Status.objects.get(app_name='COMMENT', action='BLOCKED', is_active=True)
            updated = queryset.update(status=blocked_status)
            self.message_user(
                request,
                f'{updated} comentário(s) bloqueado(s) com sucesso.',
                messages.WARNING
            )
        except Status.DoesNotExist:
            self.message_user(
                request,
                'Status "Bloqueado" não encontrado. Crie-o primeiro.',
                messages.ERROR
            )
    block_comments.short_description = 'Bloquear comentários selecionados'


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'post__id')
    readonly_fields = ('post', 'user', 'created_at')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        """Não permite adicionar likes manualmente"""
        return False


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'comment', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'comment__id')
    readonly_fields = ('comment', 'user', 'created_at')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        """Não permite adicionar likes manualmente"""
        return False

