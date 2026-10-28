from django.contrib import admin
from django.db.models import Count

from .models import Ambassador


@admin.register(Ambassador)
class AmbassadorAdmin(admin.ModelAdmin):
    list_display = ("name", "referral_code", "college_name", "is_active", "attributed_registration_count", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "referral_code", "college_name")
    readonly_fields = ("created_at", "updated_at", "attributed_registration_count")

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_attributed_registration_count=Count("referred_registrations"))

    @admin.display(description="Attributed registrations")
    def attributed_registration_count(self, obj):
        return obj._attributed_registration_count
