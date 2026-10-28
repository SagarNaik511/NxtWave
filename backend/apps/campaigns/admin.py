from django.contrib import admin

from .models import CampaignSettings


@admin.register(CampaignSettings)
class CampaignSettingsAdmin(admin.ModelAdmin):
    list_display = ("name", "target_registrations", "duration_days", "budget_inr", "start_date", "timezone", "updated_at")

    def has_add_permission(self, request):
        return not CampaignSettings.objects.exists()
