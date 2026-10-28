from django.conf import settings

from .models import CampaignSettings


def campaign_defaults() -> dict:
    return {
        "name": settings.CAMPAIGN_NAME,
        "target_registrations": settings.CAMPAIGN_TARGET,
        "duration_days": settings.CAMPAIGN_DURATION_DAYS,
        "budget_inr": settings.CAMPAIGN_BUDGET_INR,
        "start_date": settings.CAMPAIGN_START_DATE,
        "timezone": settings.CAMPAIGN_TIME_ZONE,
    }


def get_campaign_settings() -> CampaignSettings:
    campaign, _ = CampaignSettings.objects.get_or_create(pk=1, defaults=campaign_defaults())
    return campaign


def campaign_payload(campaign: CampaignSettings) -> dict:
    return {
        "name": campaign.name,
        "target_registrations": campaign.target_registrations,
        "duration_days": campaign.duration_days,
        "budget_inr": campaign.budget_inr,
        "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
        "timezone": campaign.timezone,
        "updated_at": campaign.updated_at,
    }
