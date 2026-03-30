from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from gamification.models import GamificationSettings, Season, GamificationBonus, GamificationPenalty
from nutrition.models import Meal
from social_feed.models import Post, Comment
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
    reason = serializers.CharField(allow_null=True, allow_blank=True)
    created_at = serializers.DateTimeField()
    created_by_id = serializers.IntegerField()
    target_type = serializers.ChoiceField(choices=['meal', 'workout_checkin', 'social', 'comments'])
    target_id = serializers.IntegerField()


class GamificationAdjustmentSerializer(serializers.Serializer):
    ADJUSTMENT_CHOICES = [
        ('bonus', 'Bonus'),
        ('penalty', 'Penalty'),
    ]
    TARGET_CHOICES = [
        ('meal', 'Meal'),
        ('workout_checkin', 'WorkoutCheckin'),
        ('social', 'SocialPost'),
        ('comments', 'Comment'),
    ]

    adjustment_type = serializers.ChoiceField(choices=ADJUSTMENT_CHOICES)
    score = serializers.FloatField(min_value=0.01)
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    target_type = serializers.ChoiceField(choices=TARGET_CHOICES)
    target_id = serializers.IntegerField(min_value=1)

    TARGET_MODEL_MAP = {
        'meal': Meal,
        'workout_checkin': WorkoutCheckin,
        'social': Post,
        'comments': Comment,
    }

    MODEL_TARGET_MAP = {
        'workoutcheckin': 'workout_checkin',
        'meal': 'meal',
        'post': 'social',
        'comment': 'comments',
    }

    def validate(self, attrs):
        model = self.TARGET_MODEL_MAP[attrs['target_type']]

        try:
            target_obj = model.objects.get(pk=attrs['target_id'])
        except model.DoesNotExist:
            raise serializers.ValidationError({
                'target_id': f"{model.__name__} with id {attrs['target_id']} was not found."
            })

        attrs['target_obj'] = target_obj
        attrs['responsible_user'] = self.context['request'].user

        return attrs

    @staticmethod
    def to_adjustment_payload(instance, adjustment_type):
        target_type = GamificationAdjustmentSerializer.MODEL_TARGET_MAP.get(
            instance.content_type.model,
            instance.content_type.model,
        )

        return {
            'id': instance.id,
            'adjustment_type': adjustment_type,
            'score': instance.score,
            'reason': instance.reason,
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
            reason=validated_data.get('reason'),
            content_type=content_type,
            object_id=target_obj.id,
        )

        return instance
