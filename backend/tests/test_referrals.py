from datetime import date
from io import StringIO

from django.core import management
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase

from apps.referrals.models import Ambassador
from apps.registrations.models import Registration


class ReferralApiTests(APITestCase):
    registration_url = "/api/registrations/"

    def setUp(self):
        self.ambassador = Ambassador.objects.create(
            name="Demo Ambassador",
            referral_code=" amb-102 ",
            college_name="Demo College",
        )

    def registration_payload(self, **overrides):
        return {
            "full_name": "Referral Student",
            "email": "referral.student@example.com",
            "college_name": "Example Institute",
            "branch": "CSE",
            "graduation_year": date.today().year + 1,
            **overrides,
        }

    def test_ambassador_codes_are_normalized_and_have_readable_string_representation(self):
        self.assertEqual(self.ambassador.referral_code, "AMB-102")
        self.assertEqual(str(self.ambassador), "Demo Ambassador (AMB-102)")

    def test_referral_code_uniqueness_is_enforced_by_database(self):
        with self.assertRaises(IntegrityError):
            Ambassador.objects.create(
                name="Another Ambassador",
                referral_code="AMB-102",
                college_name="Another College",
            )

    def test_registration_without_referral_code_keeps_ambassador_empty(self):
        response = self.client.post(self.registration_url, self.registration_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(Registration.objects.get().ambassador)

    def test_registration_with_active_code_stores_authoritative_attribution(self):
        response = self.client.post(
            self.registration_url,
            self.registration_payload(referral_code=" amb-102 "),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Registration.objects.get().ambassador, self.ambassador)

    def test_unknown_referral_code_does_not_create_registration(self):
        response = self.client.post(
            self.registration_url,
            self.registration_payload(referral_code="UNKNOWN"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("referral_code", response.data)
        self.assertEqual(Registration.objects.count(), 0)

    def test_inactive_referral_code_does_not_create_registration(self):
        self.ambassador.is_active = False
        self.ambassador.save(update_fields=["is_active", "updated_at"])

        response = self.client.post(
            self.registration_url,
            self.registration_payload(referral_code="AMB-102"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("referral_code", response.data)
        self.assertEqual(Registration.objects.count(), 0)

    def test_active_referral_validation_returns_minimal_ambassador_details(self):
        response = self.client.get("/api/referrals/validate/amb-102/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            {
                "valid": True,
                "referral_code": "AMB-102",
                "ambassador_name": "Demo Ambassador",
            },
        )

    def test_unknown_and_inactive_validation_return_consistent_invalid_response(self):
        unknown_response = self.client.get("/api/referrals/validate/unknown/")
        self.ambassador.is_active = False
        self.ambassador.save(update_fields=["is_active", "updated_at"])
        inactive_response = self.client.get("/api/referrals/validate/AMB-102/")

        self.assertEqual(unknown_response.status_code, status.HTTP_200_OK)
        self.assertEqual(unknown_response.json(), {"valid": False, "referral_code": "UNKNOWN"})
        self.assertEqual(inactive_response.status_code, status.HTTP_200_OK)
        self.assertEqual(inactive_response.json(), {"valid": False, "referral_code": "AMB-102"})

    def test_demo_seed_command_is_repeatable_and_does_not_create_registrations(self):
        first_output = StringIO()
        second_output = StringIO()

        management.call_command("seed_demo_ambassadors", stdout=first_output)
        management.call_command("seed_demo_ambassadors", stdout=second_output)

        self.assertEqual(Ambassador.objects.count(), 4)
        self.assertEqual(Registration.objects.count(), 0)
        self.assertIn("Demo ambassador seed completed", first_output.getvalue())
        self.assertIn("Updated demo ambassador AMB101", second_output.getvalue())

