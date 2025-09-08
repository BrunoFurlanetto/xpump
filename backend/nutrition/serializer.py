from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from nutrition.models import Meal, MealProof, NutritionPlan, MealConfig


# serializer.py
class MealChoicesSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class MealConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealConfig
        fields = '__all__'


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

    class Meta:
        model = Meal
        fields = [
            'id', 'user', 'meal_type', 'meal_time',
            'comments', 'validation_status', 'base_points',
            'multiplier', 'proof_files', 'proofs',
            'current_streak', 'longest_streak'
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

    def create(self, validated_data):
        """
        Create a new workout check-in with associated proof files.
        Handles file uploads and creates proof records.
        """
        files = validated_data.pop('proof_files', [])  # Extract proof files
        checkin = Meal.objects.create(**validated_data)  # Create check-in

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
