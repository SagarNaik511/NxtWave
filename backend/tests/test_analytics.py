from datetime import date, datetime
from zoneinfo import ZoneInfo

from django.contrib.auth.models import User
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.referrals.models import Ambassador
from apps.registrations.models import Registration


class AnalyticsApiTests(APITestCase):
    overview_url = "/api/analytics/overview/"
    daily_url = "/api/analytics/daily/"
    ambassadors_url = "/api/analytics/ambassadors/"

    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            password="safe-test-password",
            is_staff=True,
        )
        self.token = Token.objects.create(user=self.admin)

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def create_registration(self, email, ambassador=None, created_at=None):
        registration = Registration.objects.create(
            full_name="Private Student Name",
            email=email,
            college_name="Private College",
            branch="CSE",
            graduation_year=2027,
            ambassador=ambassador,
        )
        if created_at is not None:
            Registration.objects.filter(pk=registration.pk).update(created_at=created_at)
        return registration

    def test_unauthenticated_analytics_requests_are_denied(self):
        response = self.client.get(self.overview_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_admin_can_access_analytics(self):
        self.authenticate()

        response = self.client.get(self.overview_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data_status"], "live_database")

    def test_non_staff_authenticated_user_is_denied(self):
        non_staff = User.objects.create_user(username="student", password="safe-test-password")
        non_staff_token = Token.objects.create(user=non_staff)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {non_staff_token.key}")

        response = self.client.get(self.overview_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_database_overview_metrics_are_zero_and_target_is_configuration(self):
        self.authenticate()

        response = self.client.get(self.overview_url)
        body = response.json()

        self.assertEqual(body["performance"]["total_registrations"], 0)
        self.assertEqual(body["performance"]["attributed_registrations"], 0)
        self.assertEqual(body["performance"]["unattributed_registrations"], 0)
        self.assertEqual(body["performance"]["registrations_remaining"], 500)
        self.assertEqual(body["campaign"]["target_registrations"], 500)
        self.assertIsNone(body["performance"]["most_recent_registration_at"])

    @override_settings(CAMPAIGN_TARGET=1)
    def test_remaining_registrations_never_becomes_negative(self):
        self.create_registration("one@example.com")
        self.create_registration("two@example.com")
        self.authenticate()

        response = self.client.get(self.overview_url)

        self.assertEqual(response.json()["performance"]["total_registrations"], 2)
        self.assertEqual(response.json()["performance"]["registrations_remaining"], 0)
        self.assertEqual(response.json()["performance"]["target_reached_percentage"], 200.0)

    def test_daily_endpoint_is_explicitly_unconfigured_without_campaign_start_date(self):
        self.create_registration("all-time@example.com")
        self.authenticate()

        response = self.client.get(self.daily_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["daily"], [])
        self.assertFalse(response.json()["reporting_period"]["configured"])
        self.assertIsNone(response.json()["total_in_period"])

    @override_settings(
        CAMPAIGN_START_DATE=date(2026, 10, 1),
        CAMPAIGN_DURATION_DAYS=7,
        TIME_ZONE="Asia/Kolkata",
    )
    def test_daily_counts_include_zero_days_and_exclude_outside_period(self):
        reporting_zone = ZoneInfo("Asia/Kolkata")
        self.create_registration(
            "day-one@example.com",
            created_at=timezone.make_aware(datetime(2026, 10, 1, 10, 0), reporting_zone),
        )
        self.create_registration(
            "day-three@example.com",
            created_at=timezone.make_aware(datetime(2026, 10, 3, 10, 0), reporting_zone),
        )
        self.create_registration(
            "outside@example.com",
            created_at=timezone.make_aware(datetime(2026, 10, 8, 10, 0), reporting_zone),
        )
        self.authenticate()

        response = self.client.get(self.daily_url)
        daily = response.json()["daily"]

        self.assertEqual(len(daily), 7)
        self.assertEqual([point["registrations"] for point in daily], [1, 0, 1, 0, 0, 0, 0])
        self.assertEqual(response.json()["total_in_period"], 2)

    def test_ambassador_leaderboard_includes_active_zero_and_excludes_inactive(self):
        active = Ambassador.objects.create(
            name="Active Ambassador",
            referral_code="ACTIVE1",
            college_name="Active College",
        )
        inactive = Ambassador.objects.create(
            name="Inactive Ambassador",
            referral_code="INACTIVE1",
            college_name="Inactive College",
            is_active=False,
        )
        self.create_registration("active@example.com", ambassador=active)
        self.create_registration("inactive@example.com", ambassador=inactive)
        self.authenticate()

        response = self.client.get(self.ambassadors_url)
        body = response.json()

        self.assertEqual([item["name"] for item in body["ambassadors"]], ["Active Ambassador"])
        self.assertEqual(body["ambassadors"][0]["registration_count"], 1)
        self.assertEqual(body["ambassadors"][0]["share_of_total_registrations"], 50.0)
        self.assertEqual(body["inactive_historical_attributed_registrations"], 1)

    def test_unattributed_registrations_are_counted_and_share_denominator_is_documented(self):
        active = Ambassador.objects.create(
            name="Counted Ambassador",
            referral_code="COUNTED1",
            college_name="Counted College",
        )
        self.create_registration("attributed@example.com", ambassador=active)
        self.create_registration("unattributed@example.com")
        self.authenticate()

        body = self.client.get(self.ambassadors_url).json()

        self.assertEqual(body["attributed_registrations"], 1)
        self.assertEqual(body["unattributed_registrations"], 1)
        self.assertEqual(body["share_denominator"], "all_registrations")

    def test_analytics_responses_never_include_student_personal_data(self):
        self.create_registration("student.private@example.com")
        self.authenticate()

        response_text = str(self.client.get(self.overview_url).json())
        response_text += str(self.client.get(self.daily_url).json())
        response_text += str(self.client.get(self.ambassadors_url).json())

        self.assertNotIn("student.private@example.com", response_text)
        self.assertNotIn("Private Student Name", response_text)
        self.assertNotIn("Private College", response_text)

    def test_login_endpoint_issues_token_only_for_staff_user(self):
        self.client.credentials()

        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "safe-test-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.json())
        self.assertEqual(response.json()["user"]["username"], "admin")

