from datetime import date

from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase

from apps.registrations.models import Registration


REGISTRATION_PAYLOAD = {
    "full_name": "  Asha   Rao ",
    "email": " ASHA.RAO@Example.COM ",
    "college_name": "  Example Institute of Technology ",
    "branch": " CSE ",
    "graduation_year": date.today().year + 1,
}


class RegistrationApiTests(APITestCase):
    url = "/api/registrations/"

    def test_valid_registration_creates_record_and_returns_safe_response(self):
        response = self.client.post(self.url, REGISTRATION_PAYLOAD, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Registration.objects.count(), 1)
        registration = Registration.objects.get()
        self.assertEqual(registration.full_name, "Asha Rao")
        self.assertEqual(registration.email, "asha.rao@example.com")
        self.assertEqual(registration.college_name, "Example Institute of Technology")
        self.assertNotIn("email", response.data)
        self.assertEqual(response.data["full_name"], "Asha Rao")

    def test_required_fields_return_field_specific_errors(self):
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ("full_name", "email", "college_name", "branch", "graduation_year"):
            self.assertIn(field, response.data)
        self.assertEqual(Registration.objects.count(), 0)

    def test_invalid_email_is_rejected(self):
        payload = {**REGISTRATION_PAYLOAD, "email": "not-an-email"}

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertEqual(Registration.objects.count(), 0)

    def test_invalid_graduation_year_is_rejected_without_stale_current_year_constant(self):
        payload = {**REGISTRATION_PAYLOAD, "graduation_year": date.today().year + 9}

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("graduation_year", response.data)

    def test_duplicate_normalized_email_returns_conflict_and_keeps_one_record(self):
        first_response = self.client.post(self.url, REGISTRATION_PAYLOAD, format="json")
        duplicate_payload = {**REGISTRATION_PAYLOAD, "email": "asha.rao@example.com"}

        second_response = self.client.post(self.url, duplicate_payload, format="json")

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("email", second_response.data)
        self.assertEqual(Registration.objects.count(), 1)

    def test_database_unique_constraint_cannot_be_bypassed(self):
        Registration.objects.create(
            full_name="First Person",
            email="same@example.com",
            college_name="Example College",
            branch="IT",
            graduation_year=date.today().year,
        )

        with self.assertRaises(IntegrityError):
            Registration.objects.create(
                full_name="Second Person",
                email="same@example.com",
                college_name="Example College",
                branch="IT",
                graduation_year=date.today().year,
            )

    def test_registration_collection_has_no_unauthenticated_list_endpoint(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertNotIsInstance(response.data, list)

