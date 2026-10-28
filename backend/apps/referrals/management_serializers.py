import re

from django.db.models import Count
from rest_framework import serializers

from .models import REFERRAL_CODE_PATTERN, Ambassador, normalize_referral_code
from .services import generate_unique_referral_code


DEFAULT_AMBASSADOR_COLLEGE = "Not specified"


class AmbassadorManagementSerializer(serializers.ModelSerializer):
    attributed_registration_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ambassador
        fields = [
            "id",
            "name",
            "referral_code",
            "college_name",
            "is_active",
            "attributed_registration_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "attributed_registration_count",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "referral_code": {
                "required": False,
                "allow_blank": True,
                "max_length": 50,
                "validators": [],
            },
            "college_name": {"required": False, "allow_blank": True},
        }

    def validate_name(self, value: str) -> str:
        normalized = " ".join(value.strip().split())
        if len(normalized) < 2:
            raise serializers.ValidationError("Enter an ambassador name.")
        return normalized

    def validate_college_name(self, value: str) -> str:
        normalized = " ".join(value.strip().split())
        return normalized or DEFAULT_AMBASSADOR_COLLEGE

    def validate_referral_code(self, value: str) -> str:
        normalized = normalize_referral_code(value)
        if not normalized:
            if self.instance is not None:
                raise serializers.ValidationError("Referral code cannot be blank once assigned.")
            return normalized
        if re.fullmatch(REFERRAL_CODE_PATTERN, normalized) is None:
            raise serializers.ValidationError(
                "Referral codes may contain only letters, numbers, and hyphens."
            )
        duplicate_query = Ambassador.objects.filter(referral_code=normalized)
        if self.instance is not None:
            duplicate_query = duplicate_query.exclude(pk=self.instance.pk)
        if duplicate_query.exists():
            raise serializers.ValidationError("This referral code is already assigned to another ambassador.")
        return normalized

    def create(self, validated_data: dict) -> Ambassador:
        referral_code = validated_data.pop("referral_code", "")
        if not referral_code:
            referral_code = generate_unique_referral_code(validated_data["name"])
        validated_data.setdefault("college_name", DEFAULT_AMBASSADOR_COLLEGE)
        return Ambassador.objects.create(referral_code=referral_code, **validated_data)

    def update(self, instance: Ambassador, validated_data: dict) -> Ambassador:
        validated_data.setdefault("college_name", instance.college_name or DEFAULT_AMBASSADOR_COLLEGE)
        return super().update(instance, validated_data)


def ambassador_queryset():
    return Ambassador.objects.annotate(
        attributed_registration_count=Count("referred_registrations")
    ).order_by("-is_active", "name", "referral_code")
