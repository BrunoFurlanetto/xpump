from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from gamification.models import GamificationSettings, Season, GamificationBonus, GamificationPenalty
from nutrition.models import Meal
from workouts.models import WorkoutCheckin


class GamificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamificationSettings
        exclude = ['singleton_id']


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = '__all__'


class GamificationAdjustmentResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    adjustment_type = serializers.ChoiceField(choices=['bonus', 'penalty'])
    score = serializers.FloatField()
    created_at = serializers.DateTimeField()
    created_by_id = serializers.IntegerField()
    target_type = serializers.ChoiceField(choices=['meal', 'workout_checkin'])
    target_id = serializers.IntegerField()


class GamificationAdjustmentSerializer(serializers.Serializer):
    ADJUSTMENT_CHOICES = [
        ('bonus', 'Bonus'),
        ('penalty', 'Penalty'),
    ]
    TARGET_CHOICES = [
        ('meal', 'Meal'),
        ('workout_checkin', 'WorkoutCheckin'),
    ]

    adjustment_type = serializers.ChoiceField(choices=ADJUSTMENT_CHOICES)
    score = serializers.FloatField(min_value=0.01)
    target_type = serializers.ChoiceField(choices=TARGET_CHOICES)
    target_id = serializers.IntegerField(min_value=1)
    user_id = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        request = self.context['request']
        user_id = attrs.get('user_id')

        if user_id and not request.user.is_staff:
            raise serializers.ValidationError({
                'user_id': 'Only staff users can set user_id explicitly.'
            })

        model = Meal if attrs['target_type'] == 'meal' else WorkoutCheckin

        try:
            target_obj = model.objects.get(pk=attrs['target_id'])
        except model.DoesNotExist:
            raise serializers.ValidationError({
                'target_id': f"{model.__name__} with id {attrs['target_id']} was not found."
            })

        attrs['target_obj'] = target_obj
        attrs['responsible_user'] = request.user

        if user_id:
            attrs['responsible_user'] = User.objects.filter(pk=user_id).first()
            if attrs['responsible_user'] is None:
                raise serializers.ValidationError({'user_id': f'User with id {user_id} was not found.'})

        return attrs

    @staticmethod
    def to_adjustment_payload(instance, adjustment_type):
        target_type = instance.content_type.model
        if target_type == 'workoutcheckin':
            target_type = 'workout_checkin'

        return {
            'id': instance.id,
            'adjustment_type': adjustment_type,
            'score': instance.score,
            'created_at': instance.created_at,
            'created_by_id': instance.created_by_id,
            'target_type': target_type,
            'target_id': instance.object_id,
        }

    def create(self, validated_data):
        target_obj = validated_data['target_obj']
        responsible_user = validated_data['responsible_user']
        content_type = ContentType.objects.get_for_model(target_obj)

        model_cls = GamificationBonus if validated_data['adjustment_type'] == 'bonus' else GamificationPenalty

        instance = model_cls.objects.create(
            created_by=responsible_user,
            score=validated_data['score'],
            content_type=content_type,
            object_id=target_obj.id,
        )

        return instance
