from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from nutrition.models import Meal, MealProof, NutritionPlan


class MealConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = 'MealConfig'
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

            # Check for forbidden field updates
            forbidden_fields = provided_fields - allowed_fields
            if forbidden_fields:
                raise serializers.ValidationError(
                    "Only comments can be updated."
                )

        return attrs


class NutritionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionPlan
        fields = '__all__'
        read_only_fields = ['id']

    def validate_pdf_file(self, value):
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError('The file must be a PDF.')

        return value
