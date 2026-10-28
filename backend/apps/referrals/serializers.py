from rest_framework import serializers

from .models import normalize_referral_code


class ReferralValidationSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    referral_code = serializers.CharField()
    ambassador_name = serializers.CharField(required=False)

    def to_representation(self, instance):
        response = {
            "valid": bool(instance.get("valid")),
            "referral_code": normalize_referral_code(instance.get("referral_code", "")),
        }
        if instance.get("ambassador_name"):
            response["ambassador_name"] = instance["ambassador_name"]
        return response

