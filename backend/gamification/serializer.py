from rest_framework import serializers

from gamification.models import GamificationSettings, Season


class GamificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamificationSettings
        exclude = ['singleton_id']


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = '__all__'
