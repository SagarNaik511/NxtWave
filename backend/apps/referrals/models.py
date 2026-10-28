from django.core.validators import RegexValidator
from django.db import models


REFERRAL_CODE_PATTERN = r"^[A-Z0-9-]+$"


def normalize_referral_code(value: str) -> str:
    return value.strip().upper()


class Ambassador(models.Model):
    name = models.CharField(max_length=160)
    referral_code = models.CharField(
        max_length=50,
        unique=True,
        validators=[
            RegexValidator(
                regex=REFERRAL_CODE_PATTERN,
                message="Referral codes may contain only letters, numbers, and hyphens.",
            )
        ],
    )
    college_name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "referral_code"]

    def save(self, *args, **kwargs):
        self.referral_code = normalize_referral_code(self.referral_code)
        self.full_clean(validate_unique=False)
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.name} ({self.referral_code})"

