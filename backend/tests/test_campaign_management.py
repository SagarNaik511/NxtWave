import csv
from datetime import date, datetime
from io import StringIO
from zoneinfo import ZoneInfo

from django.contrib.auth.models import User
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.campaigns.models import CampaignSettings
from apps.registrations.models import Registration
from apps.referrals.models import Ambassador


class CampaignManagementApiTests(APITestCase):
    campaign_url = "/api/analytics/campaign/"
    overview_url = "/api/analytics/overview/"
    daily_url = "/api/analytics/daily/"
    export_url = "/api/analytics/export.csv"

    def setUp(self):
        admin = User.objects.create_user(username="campaign-admin", password="safe-password", is_staff=True)
        self.token = Token.objects.create(user=admin)

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def create_registration(self, email, created_at, ambassador=None):
        registration = Registration.objects.create(
            full_name="Private Student Name",
            email=email,
            college_name="Private College",
            branch="CSE",
            graduation_year=2027,
            ambassador=ambassador,
        )
        Registration.objects.filter(pk=registration.pk).update(created_at=created_at)
        return registration

    def test_campaign_settings_require_admin_authentication(self):
        response = self.client.get(self.campaign_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_read_and_update_persisted_campaign_settings(self):
        self.authenticate()

        initial = self.client.get(self.campaign_url)
        self.assertEqual(initial.status_code, status.HTTP_200_OK)
        self.assertEqual(initial.json()["campaign"]["target_registrations"], 500)

        response = self.client.patch(
            self.campaign_url,
            {
                "name": "AI Sprint Pilot",
                "target_registrations": 250,
                "duration_days": 14,
                "budget_inr": 0,
                "start_date": "2026-11-01",
                "timezone": "Asia/Kolkata",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["campaign"]["name"], "AI Sprint Pilot")
        self.assertEqual(response.json()["campaign"]["budget_inr"], 0)
        self.assertEqual(CampaignSettings.objects.get().target_registrations, 250)

    def test_invalid_campaign_settings_return_field_errors(self):
        self.authenticate()

        response = self.client.patch(
            self.campaign_url,
            {
                "target_registrations": 0,
                "duration_days": 366,
                "budget_inr": -1,
                "start_date": "not-a-date",
                "timezone": "Not/AZone",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        errors = response.json()["errors"]
        for field in ("target_registrations", "duration_days", "budget_inr", "start_date", "timezone"):
            self.assertIn(field, errors)

    def test_campaign_period_is_unavailable_without_start_date(self):
        self.authenticate()

        response = self.client.get(f"{self.daily_url}?period=campaign")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["selected_period"]["available"])
        self.assertEqual(response.json()["daily"], [])
        self.assertIn("start date", response.json()["message"])

    def test_invalid_custom_period_is_rejected(self):
        self.authenticate()

        response = self.client.get(f"{self.overview_url}?period=custom&start_date=2026-11-03&end_date=2026-11-01")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_date", response.json()["errors"])

    @override_settings(CAMPAIGN_START_DATE=date(2026, 11, 1), CAMPAIGN_DURATION_DAYS=7)
    def test_custom_period_counts_real_records_and_zero_days(self):
        reporting_zone = ZoneInfo("Asia/Kolkata")
        self.create_registration("one@example.com", timezone.make_aware(datetime(2026, 11, 1, 10), reporting_zone))
        self.create_registration("three@example.com", timezone.make_aware(datetime(2026, 11, 3, 10), reporting_zone))
        self.create_registration("outside@example.com", timezone.make_aware(datetime(2026, 11, 9, 10), reporting_zone))
        self.authenticate()

        daily = self.client.get(f"{self.daily_url}?period=custom&start_date=2026-11-01&end_date=2026-11-03")
        overview = self.client.get(f"{self.overview_url}?period=custom&start_date=2026-11-01&end_date=2026-11-03")

        self.assertEqual([point["registrations"] for point in daily.json()["daily"]], [1, 0, 1])
        self.assertEqual(overview.json()["selected_performance"]["total_registrations"], 2)
        self.assertEqual(overview.json()["performance"]["total_registrations"], 3)

    def test_csv_export_requires_authentication_and_contains_aggregate_rows_only(self):
        ambassador = Ambassador.objects.create(name="Ambassador, One", referral_code="CSV1", college_name="College")
        self.create_registration(
            "private@example.com",
            timezone.make_aware(datetime(2026, 10, 1, 10), ZoneInfo("Asia/Kolkata")),
            ambassador,
        )
        self.create_registration(
            "unattributed@example.com",
            timezone.make_aware(datetime(2026, 10, 2, 10), ZoneInfo("Asia/Kolkata")),
        )

        denied = self.client.get(self.export_url)
        self.assertEqual(denied.status_code, status.HTTP_401_UNAUTHORIZED)

        self.authenticate()
        response = self.client.get(f"{self.export_url}?period=custom&start_date=2026-10-01&end_date=2026-10-02")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("text/csv", response["Content-Type"])
        self.assertRegex(response["Content-Disposition"], r'filename="ai-sprint-custom-report-\d{4}-\d{2}-\d{2}\.csv"')
        rows = list(csv.DictReader(StringIO(response.content.decode("utf-8"))))
        self.assertEqual(rows[0]["report_type"], "summary")
        self.assertEqual(rows[0]["registrations"], "2")
        self.assertEqual(rows[0]["unattributed_registrations"], "1")
        self.assertNotIn("private@example.com", response.content.decode("utf-8"))
        self.assertNotIn("Private Student Name", response.content.decode("utf-8"))
        self.assertIn("Ambassador, One", response.content.decode("utf-8"))

    def test_empty_all_time_csv_exports_summary_without_student_data(self):
        self.authenticate()

        response = self.client.get(self.export_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = list(csv.DictReader(StringIO(response.content.decode("utf-8"))))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["report_type"], "summary")
        self.assertEqual(rows[0]["registrations"], "0")
