from django.db import DatabaseError, IntegrityError, transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegistrationCreateSerializer, RegistrationResponseSerializer


class RegistrationCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                registration = serializer.save()
        except ValidationError as error:
            return Response(error.detail, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"email": ["A registration for this email already exists."]},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            return Response(
                {"detail": "Registration could not be completed right now. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            RegistrationResponseSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )

