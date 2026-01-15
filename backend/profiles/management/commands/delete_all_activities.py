"""
Management command to delete all workouts, meals, and posts from the system.
Uses the model delete() methods to ensure proper cleanup of points and streaks.

Usage:
    python manage.py delete_all_activities

    With confirmation skip (use with caution):
    python manage.py delete_all_activities --no-confirm
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from workouts.models import WorkoutCheckin
from nutrition.models import Meal
from social_feed.models import Post


class Command(BaseCommand):
    help = 'Delete all workouts, meals, and posts using model delete() methods for proper cleanup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-confirm',
            action='store_true',
            help='Skip confirmation prompt',
        )

    def handle(self, *args, **options):
        # Count items before deletion
        workouts_count = WorkoutCheckin.objects.count()
        meals_count = Meal.objects.count()
        posts_count = Post.objects.count()

        self.stdout.write(self.style.WARNING('\n' + '='*70))
        self.stdout.write(self.style.WARNING('ATENÇÃO: Esta operação irá deletar TODOS os dados:'))
        self.stdout.write(self.style.WARNING('='*70))
        self.stdout.write(f'  • Treinos (WorkoutCheckin): {workouts_count}')
        self.stdout.write(f'  • Refeições (Meal): {meals_count}')
        self.stdout.write(f'  • Posts (Post): {posts_count}')
        self.stdout.write(self.style.WARNING('='*70))
        self.stdout.write(self.style.WARNING('Os pontos e streaks serão automaticamente ajustados.'))
        self.stdout.write(self.style.WARNING('Esta ação NÃO pode ser desfeita!\n'))

        # Confirmation
        if not options['no_confirm']:
            confirmation = input('Digite "DELETE ALL" para confirmar a exclusão: ')
            if confirmation != 'DELETE ALL':
                self.stdout.write(self.style.ERROR('Operação cancelada.'))
                return

        self.stdout.write(self.style.WARNING('\nIniciando exclusão...'))

        try:
            with transaction.atomic():
                # Delete posts first (they reference workouts and meals)
                self.stdout.write('\n1. Deletando posts...')
                deleted_posts = 0
                for post in Post.objects.all():
                    post.delete()
                    deleted_posts += 1
                    if deleted_posts % 100 == 0:
                        self.stdout.write(f'   Posts deletados: {deleted_posts}/{posts_count}')

                self.stdout.write(self.style.SUCCESS(f'   ✓ {deleted_posts} posts deletados com sucesso'))

                # Delete workouts (using model delete() to adjust points and streaks)
                self.stdout.write('\n2. Deletando treinos...')
                deleted_workouts = 0
                for workout in WorkoutCheckin.objects.all():
                    workout.delete()  # Uses custom delete() method
                    deleted_workouts += 1
                    if deleted_workouts % 50 == 0:
                        self.stdout.write(f'   Treinos deletados: {deleted_workouts}/{workouts_count}')

                self.stdout.write(self.style.SUCCESS(f'   ✓ {deleted_workouts} treinos deletados com sucesso'))

                # Delete meals (using model delete() to adjust points)
                self.stdout.write('\n3. Deletando refeições...')
                deleted_meals = 0
                for meal in Meal.objects.all():
                    meal.delete()  # Uses custom delete() method
                    deleted_meals += 1
                    if deleted_meals % 50 == 0:
                        self.stdout.write(f'   Refeições deletadas: {deleted_meals}/{meals_count}')

                self.stdout.write(self.style.SUCCESS(f'   ✓ {deleted_meals} refeições deletadas com sucesso'))

            # Success summary
            self.stdout.write('\n' + '='*70)
            self.stdout.write(self.style.SUCCESS('EXCLUSÃO CONCLUÍDA COM SUCESSO!'))
            self.stdout.write('='*70)
            self.stdout.write(f'  • Posts deletados: {deleted_posts}')
            self.stdout.write(f'  • Treinos deletados: {deleted_workouts}')
            self.stdout.write(f'  • Refeições deletadas: {deleted_meals}')
            self.stdout.write(f'  • Total de itens deletados: {deleted_posts + deleted_workouts + deleted_meals}')
            self.stdout.write('='*70)
            self.stdout.write(self.style.SUCCESS('\nPontos e streaks foram ajustados automaticamente.\n'))

        except Exception as e:
            self.stdout.write('\n' + '='*70)
            self.stdout.write(self.style.ERROR('ERRO DURANTE A EXCLUSÃO!'))
            self.stdout.write('='*70)
            self.stdout.write(self.style.ERROR(f'Erro: {str(e)}'))
            self.stdout.write(self.style.WARNING('\nA transação foi revertida. Nenhum dado foi deletado.'))
            self.stdout.write('='*70 + '\n')
            raise

