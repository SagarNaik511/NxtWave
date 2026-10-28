from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from apps.campaigns.models import CampaignSettings


class CampaignSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignSettings
        fields = (
            "name",
            "target_registrations",
            "duration_days",
            "budget_inr",
            "start_date",
            "timezone",
            "updated_at",
        )
        read_only_fields = ("updated_at",)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Campaign name cannot be blank.")
        return value.strip()

    def validate_timezone(self, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Enter a valid IANA timezone, such as Asia/Kolkata.")
        return value
