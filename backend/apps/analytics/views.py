from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .exporters import campaign_csv_response
from .serializers import CampaignSettingsSerializer
from .services import PeriodValidationError, ambassador_metrics, daily_metrics, overview_metrics, resolve_period
from .throttles import AdminLoginThrottle
from apps.campaigns.services import get_campaign_settings


class AdminLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginThrottle]

    def post(self, request):
        username = str(request.data.get("username", "")).strip()
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_active or not user.is_staff:
            return Response(
                {"detail": "Invalid administrator credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Keep one active token per administrator. A new sign-in invalidates any
        # older token instead of allowing an unbounded set of long-lived tokens.
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        return Response({"token": token.key, "user": {"username": user.get_username()}})


class AdminLogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth is not None:
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAnalyticsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]


def period_arguments(request):
    return {
        "period_key": request.query_params.get("period", "all_time"),
        "start_date_value": request.query_params.get("start_date"),
        "end_date_value": request.query_params.get("end_date"),
    }


def period_error_response(error: PeriodValidationError):
    return Response(
        {"detail": "The reporting period is invalid.", "errors": error.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


class OverviewView(AdminAnalyticsView):
    def get(self, request):
        try:
            return Response(overview_metrics(**period_arguments(request)))
        except PeriodValidationError as error:
            return period_error_response(error)


class DailyView(AdminAnalyticsView):
    def get(self, request):
        arguments = period_arguments(request)
        if "period" not in request.query_params:
            arguments["period_key"] = "campaign"
        try:
            return Response(daily_metrics(**arguments))
        except PeriodValidationError as error:
            return period_error_response(error)


class AmbassadorsView(AdminAnalyticsView):
    def get(self, request):
        try:
            return Response(ambassador_metrics(**period_arguments(request)))
        except PeriodValidationError as error:
            return period_error_response(error)


class CampaignSettingsView(AdminAnalyticsView):
    def get(self, request):
        campaign = get_campaign_settings()
        return Response({"data_status": "campaign_configuration", "campaign": CampaignSettingsSerializer(campaign).data})

    def patch(self, request):
        campaign = get_campaign_settings()
        serializer = CampaignSettingsSerializer(campaign, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"detail": "Campaign settings are invalid.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        try:
            campaign = serializer.save()
        except DjangoValidationError as error:
            return Response({"detail": "Campaign settings are invalid.", "errors": error.message_dict}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"data_status": "campaign_configuration", "campaign": CampaignSettingsSerializer(campaign).data})


class CampaignExportView(AdminAnalyticsView):
    def get(self, request):
        try:
            selection = resolve_period(**period_arguments(request))
        except PeriodValidationError as error:
            return period_error_response(error)
        if not selection.available:
            return Response(
                {"detail": selection.message or "The selected reporting period is unavailable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return campaign_csv_response(selection)

