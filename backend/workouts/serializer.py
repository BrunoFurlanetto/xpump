from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from workouts.models import WorkoutCheckin, WorkoutCheckinProof


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
        required=False  # permite criar check-in sem arquivo
    )
    proofs = WorkoutCheckinProofSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutCheckin
        fields = [
            'id', 'user', 'comments', 'workout_date',
            'duration', 'validation_status', 'base_points',
            'multiplier', 'proof_files', 'proofs'
        ]
        read_only_fields = ('user', 'base_points', 'multiplier', 'validation_status')

    def create(self, validated_data):
        files = validated_data.pop('proof_files', [])
        checkin = WorkoutCheckin.objects.create(**validated_data)

        for f in files:
            WorkoutCheckinProof.objects.create(checkin=checkin, file=f)

        return checkin

    def update(self, instance, validated_data):
        if validated_data.keys - {'comments'}:
            raise serializers.ValidationError('Only comments can be updated.')

        validated_data = {key: value for key, value in validated_data.items() if key == 'comments'}

        return super().update(instance, validated_data)
