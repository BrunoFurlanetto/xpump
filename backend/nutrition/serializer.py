from django.core.validators import FileExtensionValidator
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from gamification.models import GamificationBonus, GamificationPenalty
from nutrition.models import Meal, MealProof, NutritionPlan, MealConfig


# serializer.py
class MealChoicesSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class MealConfigSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MealConfig
        fields = [
            'id', 'meal_name', 'display_name', 'interval_start', 'interval_end', 'description'
        ]
        read_only_fields = ['id', 'display_name']

    def get_display_name(self, obj):
        return obj.get_meal_name_display()


class MealProofSerializer(serializers.ModelSerializer):
    """
    Serializer for workout check-in proof files.
    Handles serialization of uploaded images and videos as workout evidence.
    """

    class Meta:
        model = MealProof
        fields = ['id', 'file']
        read_only_fields = ['id']


class MealSerializer(serializers.ModelSerializer):
    proof_files = serializers.ListField(
        child=serializers.FileField(
            validators=[FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'mp4']
            )]
        ),
        write_only=True,
        required=False
    )  # List of proof files for upload (write-only)
    proofs = MealProofSerializer(many=True, read_only=True)
    current_streak = serializers.SerializerMethodField(read_only=True)
    longest_streak = serializers.SerializerMethodField(read_only=True)
    level_up = serializers.BooleanField(read_only=True, default=False)
    total_bonus = serializers.SerializerMethodField(read_only=True)
    total_penalty = serializers.SerializerMethodField(read_only=True)
    bonus_list = serializers.SerializerMethodField(read_only=True)
    penalties_list = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Meal
        fields = [
            'id', 'user', 'meal_type', 'meal_time',
            'comments', 'validation_status', 'base_points',
            'multiplier', 'proof_files', 'proofs',
            'current_streak', 'longest_streak', 'level_up', 'fasting',
            'total_bonus', 'total_penalty', 'bonus_list', 'penalties_list'
        ]
        # Prevent modification of automatically calculated fields
        read_only_fields = ('user', 'base_points', 'multiplier', 'validation_status')

    def validate(self, attrs):
        if self.instance:  # Update operation (instance exists)
            allowed_fields = {'comments'}  # Only comments can be updated
            provided_fields = set(attrs.keys())
            forbidden_fields = provided_fields - allowed_fields  # Check for forbidden field updates

            if forbidden_fields:
                raise serializers.ValidationError(
                    "Only comments can be updated."
                )
            
            return attrs

        # Create operation: require proof files unless fasting
        files = attrs.get('proof_files', [])

        if not files and not attrs.get('fasting', False):
            raise serializers.ValidationError('At least one proof file is required.')

        return attrs

    def get_current_streak(self, obj):
        """
        Get the user's current workout streak.
        Returns 0 if no streak record exists.
        """
        try:
            return obj.user.meal_streak.current_streak
        except:
            return 0

    def get_longest_streak(self, obj):
        """
        Get the user's longest workout streak record.
        Returns 0 if no streak record exists.
        """
        try:
            return obj.user.meal_streak.longest_streak
        except:
            return 0

    @staticmethod
    def _get_full_name(user):
        full_name = user.get_full_name().strip()
        if full_name:
            return full_name
        return user.username

    def _build_adjustments_cache(self, ids):
        content_type_id = ContentType.objects.get_for_model(Meal).id

        bonuses = GamificationBonus.objects.filter(
            content_type_id=content_type_id,
            object_id__in=ids,
        ).select_related('created_by').order_by('-created_at')

        penalties = GamificationPenalty.objects.filter(
            content_type_id=content_type_id,
            object_id__in=ids,
        ).select_related('created_by').order_by('-created_at')

        cache = {
            meal_id: {
                'total_bonus': 0.0,
                'total_penalty': 0.0,
                'bonus_list': [],
                'penalties_list': [],
            }
            for meal_id in ids
        }

        for bonus in bonuses:
            payload = {
                'score': float(bonus.score),
                'created_at': bonus.created_at,
                'created_by': {
                    'id': bonus.created_by_id,
                    'fullname': self._get_full_name(bonus.created_by),
                },
                'reason': bonus.reason,
            }
            cache[bonus.object_id]['bonus_list'].append(payload)
            cache[bonus.object_id]['total_bonus'] += float(bonus.score)

        for penalty in penalties:
            payload = {
                'score': float(penalty.score),
                'created_at': penalty.created_at,
                'created_by': {
                    'id': penalty.created_by_id,
                    'fullname': self._get_full_name(penalty.created_by),
                },
                'reason': penalty.reason,
            }
            cache[penalty.object_id]['penalties_list'].append(payload)
            cache[penalty.object_id]['total_penalty'] += float(penalty.score)

        return cache

    def _ensure_adjustments_cache(self, obj):
        if hasattr(self, '_adjustments_cache'):
            return

        instance = self.instance
        if instance is None:
            self._adjustments_cache = self._build_adjustments_cache([obj.id])
            return

        if hasattr(instance, '__iter__') and not isinstance(instance, Meal):
            ids = [item.id for item in instance]
        else:
            ids = [instance.id]

        self._adjustments_cache = self._build_adjustments_cache(ids)

    def _get_adjustment_summary(self, obj):
        self._ensure_adjustments_cache(obj)
        return self._adjustments_cache.get(obj.id, {
            'total_bonus': 0.0,
            'total_penalty': 0.0,
            'bonus_list': [],
            'penalties_list': [],
        })

    def get_total_bonus(self, obj):
        return self._get_adjustment_summary(obj)['total_bonus']

    def get_total_penalty(self, obj):
        return self._get_adjustment_summary(obj)['total_penalty']

    def get_bonus_list(self, obj):
        return self._get_adjustment_summary(obj)['bonus_list']

    def get_penalties_list(self, obj):
        return self._get_adjustment_summary(obj)['penalties_list']

    def create(self, validated_data):
        """
        Create a new workout check-in with associated proof files.
        Handles file uploads and creates proof records.
        """
        files = validated_data.pop('proof_files', [])  # Extract proof files
        user_level = validated_data['user'].profile.level
        checkin = Meal.objects.create(**validated_data)  # Create check-in
        level_up = checkin.user.profile.level > user_level
        setattr(checkin, 'level_up', level_up)

        # Create proof file records
        for f in files:
            MealProof.objects.create(checkin=checkin, file=f)

        return checkin

    def update(self, instance, validated_data):
        allowed_fields = {'comments'}
        provided_fields = set(validated_data.keys())
        forbidden_fields = provided_fields - allowed_fields

        if forbidden_fields:
            raise serializers.ValidationError({
                "non_field_errors": [
                    f"Only comments can be updated. Forbidden fields: {', '.join(forbidden_fields)}"
                ]
            })

        if 'comments' in validated_data:
            instance.comments = validated_data['comments']
            instance.save()

        return instance


class NutritionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionPlan
        fields = '__all__'
        read_only_fields = ['id']

    def validate_pdf_file(self, value):
        validator = FileExtensionValidator(allowed_extensions=['pdf'])
        validator(value)

        return value
