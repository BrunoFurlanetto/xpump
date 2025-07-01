# profiles/views.py
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .serializers import RegisterSerializer


class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # para receber upload de imagem

    def create(self, request, *args, **kwargs):
        """
        Sobrescreve para não retornar o hash de senha e devolver dados úteis.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # monta a resposta
        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            # se quiser retornar dados do profile, faça algo como:
            "profile": {
                "height": user.profile.height,
                "weight": user.profile.weight,
                "photo": request.build_absolute_uri(user.profile.photo.url) if user.profile.photo else None,
                "notification_preferences": user.profile.notification_preferences,
            }
        }
        return Response(data, status=status.HTTP_201_CREATED)
