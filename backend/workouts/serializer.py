from django.core.validators import FileExtensionValidator
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from gamification.models import GamificationBonus, GamificationPenalty
from workouts.models import WorkoutCheckin, WorkoutCheckinProof, WorkoutPlan


class WorkoutCheckinProofSerializer(serializers.ModelSerializer):
    """
    Serializer for workout check-in proof files.
    Handles serialization of uploaded images and videos as workout evidence.
    """
    class Meta:
        model = WorkoutCheckinProof
        fields = ['id', 'file']
        read_only_fields = ['id']


class WorkoutCheckinSerializer(serializers.ModelSerializer):
    """
    Serializer for workout check-ins with file upload support and streak information.
    Handles creation and updates with strict validation rules and automatic point calculation.
    """
    proof_files = serializers.ListField(
        child=serializers.FileField(
            validators=[FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'mp4']
            )]
        ),
        write_only=True,
        required=False
    )  # List of proof files for upload (write-only)
    proofs = WorkoutCheckinProofSerializer(many=True, read_only=True)
    current_streak = serializers.SerializerMethodField(read_only=True)
    longest_streak = serializers.SerializerMethodField(read_only=True)
    level_up = serializers.BooleanField(read_only=True, default=False)
    total_bonus = serializers.SerializerMethodField(read_only=True)
    total_penalty = serializers.SerializerMethodField(read_only=True)
    bonus_list = serializers.SerializerMethodField(read_only=True)
    penalties_list = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WorkoutCheckin
        fields = [
            'id', 'user', 'comments', 'workout_date',
            'duration', 'validation_status', 'base_points',
            'multiplier', 'proof_files', 'proofs', 'current_streak',
            'longest_streak', 'level_up', 'total_bonus', 'total_penalty', 'bonus_list', 'penalties_list'
        ]
        # Prevent modification of automatically calculated fields
        read_only_fields = (
            'user',
            'base_points',
            'multiplier',
            'validation_status',
            'total_bonus',
            'total_penalty',
            'bonus_list',
            'penalties_list'
        )

    def validate(self, attrs):
        """
        Custom validation to restrict updates to comments only.
        Prevents modification of critical workout data after creation.
        """
        if self.instance:  # Update operation (instance exists)
            allowed_fields = {'comments'}  # Only comments can be updated
            provided_fields = set(attrs.keys())

            # Check for forbidden field updates
            forbidden_fields = provided_fields - allowed_fields
            if forbidden_fields:
                raise serializers.ValidationError(
                    "Only comments can be updated."
                )

        return attrs

    def get_current_streak(self, obj):
        """
        Get the user's current workout streak.
        Returns 0 if no streak record exists.
        """
        try:
            return obj.user.workout_streak.current_streak
        except:
            return 0

    def get_longest_streak(self, obj):
        """
        Get the user's longest workout streak record.
        Returns 0 if no streak record exists.
        """
        try:
            return obj.user.workout_streak.longest_streak
        except:
            return 0

    @staticmethod
    def _get_full_name(user):
        full_name = user.get_full_name().strip()
        if full_name:
            return full_name
        return user.username

    def _build_adjustments_cache(self, ids):
        content_type_id = ContentType.objects.get_for_model(WorkoutCheckin).id

        bonuses = GamificationBonus.objects.filter(
            content_type_id=content_type_id,
            object_id__in=ids,
        ).select_related('created_by').order_by('-created_at')

        penalties = GamificationPenalty.objects.filter(
            content_type_id=content_type_id,
            object_id__in=ids,
        ).select_related('created_by').order_by('-created_at')

        cache = {
            workout_id: {
                'total_bonus': 0.0,
                'total_penalty': 0.0,
                'bonus_list': [],
                'penalties_list': [],
            }
            for workout_id in ids
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

        if hasattr(instance, '__iter__') and not isinstance(instance, WorkoutCheckin):
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
        checkin = WorkoutCheckin.objects.create(**validated_data)  # Create check-in

        if not files:
            raise serializers.ValidationError('At least one proof file is required.')

        level_up = checkin.user.profile.level > user_level
        setattr(checkin, 'level_up', level_up)

        # Create proof file records
        for f in files:
            WorkoutCheckinProof.objects.create(checkin=checkin, file=f)

        return checkin

    def update(self, instance, validated_data):
        """
        Update workout check-in with strict field restrictions.
        Only allows updating comments to prevent data manipulation.
        """
        if validated_data.keys() - {'comments'}:
            raise serializers.ValidationError('Only comments can be updated.')

        # Filter to only include comments field
        validated_data = {key: value for key, value in validated_data.items() if key == 'comments'}

        return super().update(instance, validated_data)


class WorkoutPlanSerializer(serializers.ModelSerializer):
    """
    Serializer for workout plans with PDF file validation.
    Handles workout plan data and ensures uploaded files are valid PDFs.
    """
    class Meta:
        model = WorkoutPlan
        fields = '__all__'
        read_only_fields = ['id']

    def validate_pdf_file(self, value):
        """
        Validate that uploaded file is a PDF.
        Ensures workout plans are provided in the correct format.
        """
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError('The file must be a PDF.')

        return value
