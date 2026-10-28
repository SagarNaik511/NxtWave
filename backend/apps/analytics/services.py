from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.campaigns.models import CampaignSettings
from apps.campaigns.services import get_campaign_settings
from apps.referrals.models import Ambassador
from apps.registrations.models import Registration


class PeriodValidationError(Exception):
    def __init__(self, errors: dict[str, str]):
        self.errors = errors
        super().__init__("Invalid reporting period.")


@dataclass(frozen=True)
class PeriodSelection:
    key: str
    campaign: CampaignSettings
    start_date: date | None
    end_date: date | None
    available: bool
    configured: bool
    timezone_name: str
    label: str
    message: str | None = None

    @property
    def timezone(self) -> ZoneInfo:
        return ZoneInfo(self.timezone_name)

    @property
    def start_at(self) -> datetime | None:
        if self.start_date is None:
            return None
        return timezone.make_aware(datetime.combine(self.start_date, time.min), self.timezone)

    @property
    def end_at(self) -> datetime | None:
        if self.end_date is None:
            return None
        exclusive_date = self.end_date + timedelta(days=1)
        return timezone.make_aware(datetime.combine(exclusive_date, time.min), self.timezone)


def campaign_reporting_period(campaign: CampaignSettings) -> dict:
    if campaign.start_date is None:
        return {
            "key": "campaign",
            "configured": False,
            "available": False,
            "start_date": None,
            "end_date": None,
            "timezone": campaign.timezone,
            "label": "Campaign period is unavailable; a campaign start date is not configured.",
            "message": "Set a campaign start date to enable date-scoped campaign reporting.",
        }

    end_date = campaign.start_date + timedelta(days=campaign.duration_days - 1)
    return {
        "key": "campaign",
        "configured": True,
        "available": True,
        "start_date": campaign.start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "timezone": campaign.timezone,
        "label": f"{campaign.start_date.isoformat()} to {end_date.isoformat()} ({campaign.timezone})",
        "message": None,
    }


def reporting_period() -> dict:
    return campaign_reporting_period(get_campaign_settings())


def _parse_date(value: str | None, field: str) -> date:
    if not value:
        raise PeriodValidationError({field: "This date is required."})
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise PeriodValidationError({field: "Use an ISO date in YYYY-MM-DD format."}) from exc


def resolve_period(
    period_key: str | None = "all_time",
    start_date_value: str | None = None,
    end_date_value: str | None = None,
    default: str = "all_time",
) -> PeriodSelection:
    campaign = get_campaign_settings()
    key = (period_key or default).strip().lower()
    if key not in {"all_time", "campaign", "custom"}:
        raise PeriodValidationError({"period": "Choose all_time, campaign, or custom."})

    if key == "campaign":
        if campaign.start_date is None:
            return PeriodSelection(
                key=key,
                campaign=campaign,
                start_date=None,
                end_date=None,
                available=False,
                configured=False,
                timezone_name=campaign.timezone,
                label="Campaign period unavailable",
                message="Configure a campaign start date before selecting the campaign period.",
            )
        end_date = campaign.start_date + timedelta(days=campaign.duration_days - 1)
        return PeriodSelection(
            key=key,
            campaign=campaign,
            start_date=campaign.start_date,
            end_date=end_date,
            available=True,
            configured=True,
            timezone_name=campaign.timezone,
            label=f"Campaign: {campaign.start_date.isoformat()} to {end_date.isoformat()}",
        )

    if key == "custom":
        start_date = _parse_date(start_date_value, "start_date")
        end_date = _parse_date(end_date_value, "end_date")
        if end_date < start_date:
            raise PeriodValidationError({"end_date": "End date must be on or after the start date."})
        if (end_date - start_date).days >= 366:
            raise PeriodValidationError({"end_date": "Custom ranges must be 366 days or fewer."})
        return PeriodSelection(
            key=key,
            campaign=campaign,
            start_date=start_date,
            end_date=end_date,
            available=True,
            configured=True,
            timezone_name=campaign.timezone,
            label=f"Custom: {start_date.isoformat()} to {end_date.isoformat()}",
        )

    reporting_zone = ZoneInfo(campaign.timezone)
    first = Registration.objects.order_by("created_at").values_list("created_at", flat=True).first()
    last = Registration.objects.order_by("-created_at").values_list("created_at", flat=True).first()
    if first is None or last is None:
        return PeriodSelection(
            key=key,
            campaign=campaign,
            start_date=None,
            end_date=None,
            available=True,
            configured=True,
            timezone_name=campaign.timezone,
            label="All-time registrations",
        )

    return PeriodSelection(
        key=key,
        campaign=campaign,
        start_date=timezone.localtime(first, reporting_zone).date(),
        end_date=timezone.localtime(last, reporting_zone).date(),
        available=True,
        configured=True,
        timezone_name=campaign.timezone,
        label="All-time registrations",
    )


def period_payload(selection: PeriodSelection) -> dict:
    return {
        "key": selection.key,
        "configured": selection.configured,
        "available": selection.available,
        "start_date": selection.start_date.isoformat() if selection.start_date else None,
        "end_date": selection.end_date.isoformat() if selection.end_date else None,
        "timezone": selection.timezone_name,
        "label": selection.label,
        "message": selection.message,
    }


def _registrations_for(selection: PeriodSelection):
    queryset = Registration.objects.all()
    if not selection.available:
        return queryset.none()
    if selection.start_at is not None and selection.end_at is not None:
        return queryset.filter(created_at__gte=selection.start_at, created_at__lt=selection.end_at)
    return queryset


def _performance(queryset) -> dict:
    total = queryset.count()
    attributed = queryset.filter(ambassador__isnull=False).count()
    most_recent = queryset.order_by("-created_at").values_list("created_at", flat=True).first()
    return {
        "total_registrations": total,
        "attributed_registrations": attributed,
        "unattributed_registrations": total - attributed,
        "most_recent_registration_at": most_recent,
    }


def overview_metrics(
    period_key: str | None = "all_time",
    start_date_value: str | None = None,
    end_date_value: str | None = None,
) -> dict:
    campaign = get_campaign_settings()
    selection = resolve_period(period_key, start_date_value, end_date_value)
    all_time = _performance(Registration.objects.all())
    selected = _performance(_registrations_for(selection))
    target = campaign.target_registrations

    return {
        "data_status": "live_database",
        "performance": {
            **all_time,
            "registrations_remaining": max(target - all_time["total_registrations"], 0),
            "target_reached_percentage": round((all_time["total_registrations"] / target) * 100, 1) if target else 0,
        },
        "selected_performance": selected,
        "campaign": {
            "name": campaign.name,
            "target_registrations": campaign.target_registrations,
            "duration_days": campaign.duration_days,
            "budget_inr": campaign.budget_inr,
            "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
            "timezone": campaign.timezone,
        },
        "reporting_period": campaign_reporting_period(campaign),
        "selected_period": period_payload(selection),
    }


def daily_metrics(
    period_key: str | None = "campaign",
    start_date_value: str | None = None,
    end_date_value: str | None = None,
    selection: PeriodSelection | None = None,
) -> dict:
    campaign = get_campaign_settings()
    selection = selection or resolve_period(period_key, start_date_value, end_date_value, default="campaign")
    if not selection.available:
        return {
            "data_status": "live_database",
            "reporting_period": campaign_reporting_period(campaign),
            "selected_period": period_payload(selection),
            "daily": [],
            "total_in_period": None,
            "message": selection.message,
        }

    queryset = _registrations_for(selection)
    if selection.start_date is None or selection.end_date is None:
        return {
            "data_status": "live_database",
            "reporting_period": campaign_reporting_period(campaign),
            "selected_period": period_payload(selection),
            "daily": [],
            "total_in_period": 0,
            "message": "No persisted registrations are available for the all-time date series.",
        }

    counts = {
        item["day"]: item["count"]
        for item in queryset.annotate(day=TruncDate("created_at", tzinfo=selection.timezone))
        .values("day")
        .annotate(count=Count("id"))
    }
    daily = [
        {
            "date": (selection.start_date + timedelta(days=offset)).isoformat(),
            "registrations": counts.get(selection.start_date + timedelta(days=offset), 0),
        }
        for offset in range((selection.end_date - selection.start_date).days + 1)
    ]
    return {
        "data_status": "live_database",
        "reporting_period": campaign_reporting_period(campaign),
        "selected_period": period_payload(selection),
        "daily": daily,
        "total_in_period": sum(point["registrations"] for point in daily),
        "message": None,
    }


def ambassador_metrics(
    period_key: str | None = "all_time",
    start_date_value: str | None = None,
    end_date_value: str | None = None,
    selection: PeriodSelection | None = None,
) -> dict:
    campaign = get_campaign_settings()
    selection = selection or resolve_period(period_key, start_date_value, end_date_value)
    queryset = _registrations_for(selection)
    total = queryset.count()
    attributed = queryset.filter(ambassador__isnull=False).count()
    inactive_attributed = queryset.filter(ambassador__is_active=False).count()
    if selection.start_at is not None and selection.end_at is not None:
        annotations = {
            "registration_count": Count(
                "referred_registrations",
                filter=Q(
                    referred_registrations__created_at__gte=selection.start_at,
                    referred_registrations__created_at__lt=selection.end_at,
                ),
            )
        }
    else:
        annotations = {"registration_count": Count("referred_registrations")}
    ambassadors = (
        Ambassador.objects.filter(is_active=True)
        .annotate(**annotations)
        .order_by("-registration_count", "name", "referral_code")
    )
    leaderboard = [
        {
            "rank": rank,
            "name": ambassador.name,
            "referral_code": ambassador.referral_code,
            "registration_count": ambassador.registration_count,
            "share_of_total_registrations": round((ambassador.registration_count / total) * 100, 1) if total else 0,
        }
        for rank, ambassador in enumerate(ambassadors, start=1)
    ]

    return {
        "data_status": "live_database",
        "total_registrations": total,
        "attributed_registrations": attributed,
        "unattributed_registrations": total - attributed,
        "share_denominator": "all_registrations" if selection.key == "all_time" else "selected_period_registrations",
        "inactive_historical_attributed_registrations": inactive_attributed,
        "ambassadors": leaderboard if selection.available else [],
        "reporting_period": campaign_reporting_period(campaign),
        "selected_period": period_payload(selection),
        "message": selection.message,
    }
