from rest_framework import serializers

from workouts.models import WorkoutCheckin


class WorkoutCheckinSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutCheckin
        fields = '__all__'

    def update(self, instance, validated_data):
        if validated_data.keys - {'comments'}:
            raise serializers.ValidationError('Only comments can be updated.')

        validated_data = {key: value for key, value in validated_data.items() if key == 'comments'}

        return super().update(instance, validated_data)
