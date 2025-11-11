from django.db import transaction
from rest_framework import serializers

from clients.models import Client
from groups.models import Group


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

    def create(self, validated_data):
        with transaction.atomic():
            try:
                client = super().create(validated_data)
                owner = getattr(client, 'owners')

                if not owner:
                    raise serializers.ValidationError({'owner': 'Client does not have an owner user relationship.'})

                main_group = Group.objects.create(
                    name=client.name,
                    owner=client.owners,
                    created_by=client.owners,
                    main=True
                )
            except Exception as e:
                raise serializers.ValidationError(f"Error creating client or main group: {str(e)}")

            client.groups = main_group
            client.save()

        return client
