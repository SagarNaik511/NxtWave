from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CampaignSettings(models.Model):
    """The single editable campaign configuration used by reporting."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    name = models.CharField(max_length=200, default="AI Sprint — Build Your First AI Project in 60 Minutes")
    target_registrations = models.PositiveIntegerField(
        default=500,
        validators=[MinValueValidator(1)],
    )
    duration_days = models.PositiveSmallIntegerField(
        default=7,
        validators=[MinValueValidator(1), MaxValueValidator(365)],
    )
    budget_inr = models.PositiveIntegerField(default=2000)
    start_date = models.DateField(null=True, blank=True)
    timezone = models.CharField(max_length=64, default="Asia/Kolkata")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "campaign settings"
        verbose_name_plural = "campaign settings"

    def clean(self):
        super().clean()
        if not self.name.strip():
            raise ValidationError({"name": "Campaign name cannot be blank."})
        try:
            ZoneInfo(self.timezone)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValidationError({"timezone": "Enter a valid IANA timezone, such as Asia/Kolkata."})

    def save(self, *args, **kwargs):
        self.pk = 1
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name
