from django.test import SimpleTestCase


class HealthEndpointTests(SimpleTestCase):
    def test_health_endpoint_returns_json_status(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "ai-sprint-api"})

