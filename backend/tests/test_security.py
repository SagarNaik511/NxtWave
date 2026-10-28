from django.contrib.auth.models import User
from django.conf import settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class AdministrativeEndpointSecurityTests(APITestCase):
    protected_urls = (
        "/api/analytics/overview/",
        "/api/analytics/daily/",
        "/api/analytics/ambassadors/",
        "/api/analytics/campaign/",
        "/api/analytics/export.csv",
    )

    def setUp(self):
        self.admin = User.objects.create_user(username="secure-admin", password="safe-password", is_staff=True)
        self.admin_token = Token.objects.create(user=self.admin)

    def test_all_administrative_endpoints_reject_anonymous_requests(self):
        for url in self.protected_urls:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, url)

    def test_non_staff_users_cannot_read_or_modify_campaign_controls(self):
        student = User.objects.create_user(username="not-staff", password="safe-password")
        token = Token.objects.create(user=student)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        read_response = self.client.get("/api/analytics/campaign/")
        patch_response = self.client.patch("/api/analytics/campaign/", {"budget_inr": 0}, format="json")

        self.assertEqual(read_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(patch_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_security_defaults_are_safe_for_local_development(self):
        self.assertTrue(settings.SECURE_CONTENT_TYPE_NOSNIFF)
        self.assertEqual(settings.X_FRAME_OPTIONS, "DENY")
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertFalse(settings.CORS_ALLOW_CREDENTIALS)
        self.assertLessEqual(settings.DATA_UPLOAD_MAX_MEMORY_SIZE, 1_048_576)
