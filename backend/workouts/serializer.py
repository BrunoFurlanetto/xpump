from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from workouts.models import WorkoutCheckin, WorkoutCheckinProof, WorkoutPlan


class WorkoutCheckinProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutCheckinProof
        fields = ['id', 'file']
        read_only_fields = ['id']


class WorkoutCheckinSerializer(serializers.ModelSerializer):
    proof_files = serializers.ListField(
        child=serializers.FileField(
            validators=[FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'mp4']
            )]
        ),
        write_only=True,
        required=False
    )
    proofs = WorkoutCheckinProofSerializer(many=True, read_only=True)
    current_streak = serializers.SerializerMethodField(read_only=True)
    longest_streak = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WorkoutCheckin
        fields = [
            'id', 'user', 'comments', 'workout_date',
            'duration', 'validation_status', 'base_points',
            'multiplier', 'proof_files', 'proofs', 'current_streak',
            'longest_streak'
        ]
        read_only_fields = ('user', 'base_points', 'multiplier', 'validation_status')

    def validate(self, attrs):
        """
        Validates that comments can be updated in updates
        """
        if self.instance:  # If is an update (Instance exists)
            allowed_fields = {'comments'}
            provided_fields = set(attrs.keys())

            # Verify if the provided fields are allowed
            forbidden_fields = provided_fields - allowed_fields
            if forbidden_fields:
                raise serializers.ValidationError(
                    "Only comments can be updated."
                )

        return attrs

    def get_current_streak(self, obj):
        try:
            return obj.user.workout_streak.current_streak
        except:
            return 0

    def get_longest_streak(self, obj):
        try:
            return obj.user.workout_streak.longest_streak
        except:
            return 0

    def create(self, validated_data):
        files = validated_data.pop('proof_files', [])
        checkin = WorkoutCheckin.objects.create(**validated_data)

        for f in files:
            WorkoutCheckinProof.objects.create(checkin=checkin, file=f)

        return checkin

    def update(self, instance, validated_data):
        if validated_data.keys() - {'comments'}:
            raise serializers.ValidationError('Only comments can be updated.')

        validated_data = {key: value for key, value in validated_data.items() if key == 'comments'}

        return super().update(instance, validated_data)


class WorkoutPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutPlan
        fields = '__all__'
        read_only_fields = ['id']

    def validate_pdf_file(self, value):
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError('The file must be a PDF.')

        return value
