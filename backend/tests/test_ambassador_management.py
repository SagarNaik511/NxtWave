from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.referrals.models import Ambassador
from apps.registrations.models import Registration


class AmbassadorManagementApiTests(APITestCase):
    list_url = "/api/referrals/ambassadors/"

    def setUp(self):
        self.admin = User.objects.create_user(
            username="ambassador-admin",
            password="safe-test-password",
            is_staff=True,
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.student = User.objects.create_user(username="student", password="safe-test-password")

    def authenticate(self, token=None):
        token = token or self.admin_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_management_endpoints_require_staff_authentication(self):
        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_401_UNAUTHORIZED)

        student_token = Token.objects.create(user=self.student)
        self.authenticate(student_token)
        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post(self.list_url, {"name": "Blocked"}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_can_create_ambassador_with_generated_code(self):
        self.authenticate()

        response = self.client.post(self.list_url, {"name": "Priya Shah"}, format="json")
        leaderboard = self.client.get("/api/analytics/ambassadors/")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()
        self.assertRegex(body["referral_code"], r"^AMB-PRIYA-SHAH-[A-Z2-9]{5}$")
        self.assertEqual(body["college_name"], "Not specified")
        self.assertEqual(body["attributed_registration_count"], 0)
        self.assertEqual(leaderboard.status_code, status.HTTP_200_OK)
        self.assertEqual(leaderboard.json()["ambassadors"][0]["referral_code"], body["referral_code"])
        self.assertEqual(leaderboard.json()["ambassadors"][0]["registration_count"], 0)
        self.assertEqual(Ambassador.objects.count(), 1)
        self.assertEqual(Registration.objects.count(), 0)

    def test_custom_codes_are_normalized_and_duplicates_are_rejected(self):
        self.authenticate()

        first = self.client.post(
            self.list_url,
            {"name": "First Ambassador", "referral_code": " custom-42 "},
            format="json",
        )
        duplicate = self.client.post(
            self.list_url,
            {"name": "Second Ambassador", "referral_code": "CUSTOM-42"},
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.json()["referral_code"], "CUSTOM-42")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("referral_code", duplicate.json()["errors"])

        invalid = self.client.post(
            self.list_url,
            {"name": "Invalid Ambassador", "referral_code": "not allowed"},
            format="json",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("referral_code", invalid.json()["errors"])

    def test_deactivation_preserves_attribution_and_blocks_new_usage(self):
        ambassador = Ambassador.objects.create(
            name="Historical Ambassador",
            referral_code="HISTORICAL-1",
            college_name="Example College",
        )
        Registration.objects.create(
            full_name="Historical Student",
            email="historical.student@example.com",
            college_name="Example College",
            branch="CSE",
            graduation_year=date.today().year + 1,
            ambassador=ambassador,
        )
        self.authenticate()

        deactivate = self.client.post(f"{self.list_url}{ambassador.pk}/deactivate/")
        listed = self.client.get(self.list_url)
        new_registration = self.client.post(
            "/api/registrations/",
            {
                "full_name": "New Student",
                "email": "new.student@example.com",
                "college_name": "Example College",
                "branch": "CSE",
                "graduation_year": date.today().year + 1,
                "referral_code": "HISTORICAL-1",
            },
            format="json",
        )

        self.assertEqual(deactivate.status_code, status.HTTP_200_OK)
        self.assertFalse(deactivate.json()["is_active"])
        self.assertEqual(deactivate.json()["attributed_registration_count"], 1)
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertFalse(listed.json()["ambassadors"][0]["is_active"])
        self.assertEqual(listed.json()["ambassadors"][0]["attributed_registration_count"], 1)
        self.assertEqual(new_registration.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Registration.objects.count(), 1)

    def test_attribution_count_increases_after_a_real_registration(self):
        ambassador = Ambassador.objects.create(
            name="Active Ambassador",
            referral_code="ACTIVE-1",
            college_name="Example College",
        )
        self.authenticate()

        registration = self.client.post(
            "/api/registrations/",
            {
                "full_name": "Referred Student",
                "email": "referred.student@example.com",
                "college_name": "Example College",
                "branch": "AI",
                "graduation_year": date.today().year + 1,
                "referral_code": "active-1",
            },
            format="json",
        )
        listed = self.client.get(self.list_url)

        self.assertEqual(registration.status_code, status.HTTP_201_CREATED)
        self.assertEqual(listed.json()["ambassadors"][0]["attributed_registration_count"], 1)
        self.assertEqual(Registration.objects.get().ambassador_id, ambassador.pk)
