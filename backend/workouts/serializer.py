from django.core.validators import FileExtensionValidator
from rest_framework import serializers

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

    class Meta:
        model = WorkoutCheckin
        fields = [
            'id', 'user', 'comments', 'workout_date',
            'duration', 'validation_status', 'base_points',
            'multiplier', 'proof_files', 'proofs', 'current_streak',
            'longest_streak', 'level_up'
        ]
        # Prevent modification of automatically calculated fields
        read_only_fields = ('user', 'base_points', 'multiplier', 'validation_status')

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
