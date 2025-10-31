from django.core.management.base import BaseCommand
from nutrition.models import MealConfig


class Command(BaseCommand):
    help = 'Cria os tipos de refeição padrão (MealConfig) se não existirem'

    def handle(self, *args, **kwargs):
        meal_types = [
            {
                'meal_name': 'breakfast',
                'interval_start': '06:00:00',
                'interval_end': '10:00:00',
                'description': 'Café da Manhã - Primeira refeição do dia'
            },
            {
                'meal_name': 'lunch',
                'interval_start': '11:00:00',
                'interval_end': '14:00:00',
                'description': 'Almoço - Refeição principal do dia'
            },
            {
                'meal_name': 'afternoon_snack',
                'interval_start': '14:30:00',
                'interval_end': '17:00:00',
                'description': 'Lanche da Tarde - Refeição intermediária'
            },
            {
                'meal_name': 'dinner',
                'interval_start': '18:00:00',
                'interval_end': '21:00:00',
                'description': 'Jantar - Última refeição do dia'
            },
        ]

        created_count = 0
        skipped_count = 0

        for meal_data in meal_types:
            meal_config, created = MealConfig.objects.get_or_create(
                meal_name=meal_data['meal_name'],
                defaults={
                    'interval_start': meal_data['interval_start'],
                    'interval_end': meal_data['interval_end'],
                    'description': meal_data['description'],
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Criado: {meal_config.meal_name} ({meal_config.interval_start} - {meal_config.interval_end})')
                )
            else:
                skipped_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⏭️  Já existe: {meal_config.meal_name}')
                )

        total_count = MealConfig.objects.count()
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Criados: {created_count}, ⏭️ Ignorados: {skipped_count}, 📦 Total: {total_count}')
        )
