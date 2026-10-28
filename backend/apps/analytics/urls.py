from django.urls import path

from .views import (
    AdminLoginView,
    AdminLogoutView,
    AmbassadorsView,
    CampaignExportView,
    CampaignSettingsView,
    DailyView,
    OverviewView,
)

urlpatterns = [
    path("auth/login/", AdminLoginView.as_view(), name="admin-login"),
    path("auth/logout/", AdminLogoutView.as_view(), name="admin-logout"),
    path("analytics/overview/", OverviewView.as_view(), name="analytics-overview"),
    path("analytics/daily/", DailyView.as_view(), name="analytics-daily"),
    path("analytics/ambassadors/", AmbassadorsView.as_view(), name="analytics-ambassadors"),
    path("analytics/campaign/", CampaignSettingsView.as_view(), name="analytics-campaign"),
    path("analytics/export.csv", CampaignExportView.as_view(), name="analytics-export"),
]
