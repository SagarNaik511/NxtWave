from datetime import date

from rest_framework import serializers

from apps.referrals.services import get_active_ambassador

from .models import Registration


def normalize_text(value: str) -> str:
    return " ".join(value.strip().split())


class RegistrationCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        max_length=254,
        validators=[],
        write_only=True,
    )
    referral_code = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        write_only=True,
    )

    class Meta:
        model = Registration
        fields = [
            "full_name",
            "email",
            "college_name",
            "branch",
            "graduation_year",
            "referral_code",
        ]

    def validate_full_name(self, value: str) -> str:
        normalized = normalize_text(value)
        if len(normalized) < 2:
            raise serializers.ValidationError("Enter your full name.")
        return normalized

    def validate_email(self, value: str) -> str:
        return value.strip().casefold()

    def validate_college_name(self, value: str) -> str:
        normalized = normalize_text(value)
        if len(normalized) < 2:
            raise serializers.ValidationError("Enter your college name.")
        return normalized

    def validate_branch(self, value: str) -> str:
        normalized = normalize_text(value)
        if len(normalized) < 2:
            raise serializers.ValidationError("Enter your branch or specialization.")
        return normalized

    def validate_referral_code(self, value: str) -> str:
        normalized = value.strip().upper()
        if normalized and get_active_ambassador(normalized) is None:
            raise serializers.ValidationError("Enter a valid active referral code or remove it.")
        return normalized

    def validate_graduation_year(self, value: int) -> int:
        current_year = date.today().year
        if value < 2000 or value > current_year + 8:
            raise serializers.ValidationError(
                f"Enter a graduation year between 2000 and {current_year + 8}."
            )
        return value

    def create(self, validated_data: dict) -> Registration:
        referral_code = validated_data.pop("referral_code", "")
        ambassador = get_active_ambassador(referral_code) if referral_code else None
        if referral_code and ambassador is None:
            raise serializers.ValidationError({"referral_code": "This referral code is no longer active."})
        validated_data["ambassador"] = ambassador
        return Registration.objects.create(**validated_data)


class RegistrationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = ["id", "full_name", "created_at"]
        read_only_fields = fields

