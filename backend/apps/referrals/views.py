from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import normalize_referral_code
from .serializers import ReferralValidationSerializer
from .services import get_active_ambassador


class ReferralValidationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, referral_code: str):
        normalized_code = normalize_referral_code(referral_code)
        ambassador = get_active_ambassador(normalized_code)
        payload = {
            "valid": ambassador is not None,
            "referral_code": normalized_code,
        }
        if ambassador is not None:
            payload["ambassador_name"] = ambassador.name

        serializer = ReferralValidationSerializer(payload)
        return Response(serializer.data)

