from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .management_serializers import AmbassadorManagementSerializer, ambassador_queryset
from .models import Ambassador


class AmbassadorManagementView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        serializer = AmbassadorManagementSerializer(ambassador_queryset(), many=True)
        return Response({"ambassadors": serializer.data})

    def post(self, request):
        serializer = AmbassadorManagementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": "Ambassador data is invalid.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            ambassador = serializer.save()
        except IntegrityError:
            return Response(
                {
                    "detail": "The ambassador could not be created because the referral code is already in use.",
                    "errors": {"referral_code": ["This referral code is already assigned to another ambassador."]},
                },
                status=status.HTTP_409_CONFLICT,
            )
        response_serializer = AmbassadorManagementSerializer(
            ambassador_queryset().get(pk=ambassador.pk)
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class AmbassadorDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get_object(self, pk: int) -> Ambassador:
        return get_object_or_404(Ambassador, pk=pk)

    def patch(self, request, pk: int):
        ambassador = self.get_object(pk)
        serializer = AmbassadorManagementSerializer(ambassador, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {"detail": "Ambassador data is invalid.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            updated = serializer.save()
        except IntegrityError:
            return Response(
                {
                    "detail": "The ambassador could not be updated because the referral code is already in use.",
                    "errors": {"referral_code": ["This referral code is already assigned to another ambassador."]},
                },
                status=status.HTTP_409_CONFLICT,
            )
        return Response(AmbassadorManagementSerializer(ambassador_queryset().get(pk=updated.pk)).data)


class AmbassadorStatusView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]
    is_active = True

    def post(self, request, pk: int):
        ambassador = get_object_or_404(Ambassador, pk=pk)
        if ambassador.is_active == self.is_active:
            return Response(AmbassadorManagementSerializer(ambassador_queryset().get(pk=pk)).data)
        ambassador.is_active = self.is_active
        ambassador.save(update_fields=["is_active", "updated_at"])
        return Response(AmbassadorManagementSerializer(ambassador_queryset().get(pk=pk)).data)
